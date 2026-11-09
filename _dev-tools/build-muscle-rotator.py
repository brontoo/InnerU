"""Build the optional atlas viewer asset; run with Python 3.12, NumPy and fast-simplification 0.1.13 (see MUSCULAR-STUDIO.md).
Input files are pinned, licensed Body Explorer exports; no network calls or portal data.
"""
import argparse, hashlib, json, struct
from pathlib import Path
import fast_simplification
import numpy as np

args = argparse.ArgumentParser()
args.add_argument('--muscles', type=Path, required=True)
args.add_argument('--skeleton', type=Path, required=True)
args.add_argument('--output', type=Path, required=True)
a = args.parse_args()
# Refuse an unrelated model rather than silently building a different anatomy.
assert hashlib.sha256(a.muscles.read_bytes()).hexdigest() == '6e84529b60b64cc8f8d5cef665fda932e359e828b66d0c2dd44ec1bd9d0bd01f'
assert hashlib.sha256(a.skeleton.read_bytes()).hexdigest() == '894ed0e98a266b727a7e290f0d4123bb087c4afe84a48d55af71d1a351ca99a5'
batches = {0: [], 1: [], 2: []}
source_names = []

def read_asset(file):
 raw=file.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]
 doc=json.loads(raw[20:20+length]); binary=raw[28+length:]
 def read(index):
  item=doc['accessors'][index]; view=doc['bufferViews'][item['bufferView']]
  dtype=np.dtype({5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[item['componentType']])
  width={'SCALAR':1,'VEC2':2,'VEC3':3}[item['type']]
  return np.ndarray((item['count'],width),dtype=dtype,buffer=binary,
   offset=view.get('byteOffset',0)+item.get('byteOffset',0),
   strides=(view.get('byteStride',width*dtype.itemsize),dtype.itemsize)).copy()
 return doc,read

for source,file in [('muscles',a.muscles),('bones',a.skeleton)]:
 doc,read=read_asset(file)
 for node in doc['nodes']:
  if 'mesh' not in node: continue
  name=node['name']
  # The display contains muscular anatomy and its skeletal support, not internal organs.
  for primitive in doc['meshes'][node['mesh']]['primitives']:
   pos=read(primitive['attributes']['POSITION']).astype(float)
   indices=read(primitive['indices']).reshape(-1,3)
   if len(indices)>1200:
    reduction=.35 if any(x in name for x in ['frontalis','orbicularis','nasalis','masseter','mentalis','risorius']) else .62
    positions,faces=fast_simplification.simplify(pos,indices,target_reduction=reduction)
   else:positions,faces=pos,indices
   positions=np.asarray(positions,dtype=float);faces=np.asarray(faces,dtype='<u4')
   # Smooth surface normals after simplification, preserving disconnected anatomy.
   normals=np.zeros_like(positions)
   face_normals=np.cross(positions[faces[:,1]]-positions[faces[:,0]],positions[faces[:,2]]-positions[faces[:,0]])
   for corner in range(3):np.add.at(normals,faces[:,corner],face_normals)
   normals/=np.maximum(1e-12,np.linalg.norm(normals,axis=1,keepdims=True))
   # Source coordinates are millimetres with Z up and anterior at negative Y.
   positions=positions[:,[0,2,1]]*np.array([.001,.001,-.001])
   normals=normals[:,[0,2,1]]*np.array([1,1,-1])
   centered=positions-positions.mean(axis=0)
   _,vectors=np.linalg.eigh(centered.T@centered)
   uv=np.column_stack((centered@vectors[:,1],centered@vectors[:,2]))
   material=2 if source=='bones' else primitive.get('material',0)
   batches[material].append((positions,normals,uv,faces))
   if len(source_names)%50==0:print('Processed',source,len(source_names),flush=True)
   source_names.append({'name':name,'source':'BodyParts3D / Z-Anatomy' if source=='muscles' else 'BodyParts3D','triangles':len(faces)})
 print('Prepared',source,len(source_names),flush=True)

all_positions=np.concatenate([part[0] for group in batches.values() for part in group])
center=(all_positions.min(axis=0)+all_positions.max(axis=0))/2
binary=bytearray();views=[];accessors=[];nodes=[];meshes=[]
def pack(array,kind,component,normalized=False):
 while len(binary)%4:binary.append(0)
 views.append({'buffer':0,'byteOffset':len(binary),'byteLength':array.nbytes})
 binary.extend(array.tobytes())
 item={'bufferView':len(views)-1,'componentType':component,'count':len(array),'type':kind}
 if normalized:item['normalized']=True
 if kind=='VEC3':item.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
 accessors.append(item);return len(accessors)-1
for material,parts in batches.items():
 chunks=[[]];vertices=0
 for item in parts:
  if vertices+len(item[0])>60000:chunks.append([]);vertices=0
  chunks[-1].append(item);vertices+=len(item[0])
 for group in chunks:
  positions=[];normals=[];uv=[];faces=[];offset=0
  for p,n,t,ix in group:
   positions.append(p-center);normals.append(n);uv.append(t);faces.append(ix+offset);offset+=len(p)
  p=np.concatenate(positions);n=np.concatenate(normals);t=np.concatenate(uv);ix=np.concatenate(faces)
  attributes={'POSITION':pack(np.rint(p/4*32767).astype('<i2'),'VEC3',5122,True),
   'NORMAL':pack(np.rint(np.clip(n,-1,1)*127).astype('i1'),'VEC3',5120,True),
   'TEXCOORD_0':pack(np.rint(np.clip((t+2)/4,0,1)*65535).astype('<u2'),'VEC2',5123,True)}
  meshes.append({'name':['Muscle tissue','Tendons and fascia','Skeletal support'][material],
   'primitives':[{'attributes':attributes,'indices':pack(ix.reshape(-1).astype('<u2'),'SCALAR',5123),'material':material}]})
  nodes.append({'name':meshes[-1]['name'],'mesh':len(meshes)-1,'scale':[4,4,4]})
colors=[[.40,.055,.027,1],[.78,.70,.54,1],[.67,.59,.46,1]]
materials=[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'roughnessFactor':.68,'metallicFactor':0},'doubleSided':True} for name,color in zip(['Muscle tissue','Tendons and fascia','Skeletal support'],colors)]
out={'asset':{'version':'2.0','generator':'InnerU optional muscular atlas build',
 'copyright':'BodyParts3D © DBCLS, CC BY-SA 2.1 Japan; Z-Anatomy © Gauthier Kervyn, CC BY-SA 4.0. Adapted from Body Explorer cd2a6391d31cf4da663304d671fae138adfd6b2d.'},
 'extensionsUsed':['KHR_mesh_quantization'],'extensionsRequired':['KHR_mesh_quantization'],
 'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,
 'materials':materials,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(binary)}],
 'extras':{'anatomicalSources':source_names,'adaptation':'Geometry simplified; source coordinates converted; meshes batched by tissue; positions and normals quantized. No lesson or grading data.'}}
encoded=json.dumps(out,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);binary+=b'\0'*((-len(binary))%4)
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(binary))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(binary),b'BIN\0')+binary)
print('Wrote',a.output,a.output.stat().st_size,'bytes;',sum(x['triangles'] for x in source_names),'triangles;',len(source_names),'source meshes',flush=True)
