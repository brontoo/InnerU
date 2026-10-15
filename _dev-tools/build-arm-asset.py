"""Extract the left-arm atlas for the movement activity (NumPy, no downloads)."""
from pathlib import Path
import json,struct,numpy as np
ROOT=Path(__file__).resolve().parents[1]
ELBOW=np.array([.445,.38,-.005]);angle=np.arctan2(.32-.445,.95-.38)
ROT=np.array([[np.cos(angle),-np.sin(angle),0],[np.sin(angle),np.cos(angle),0],[0,0,1]])
blob=bytearray();views=[];acc=[];meshes=[];nodes=[]
def pack(a,kind,component):
 while len(blob)%4:blob.append(0)
 views.append({'buffer':0,'byteOffset':len(blob),'byteLength':a.nbytes});blob.extend(a.tobytes())
 obj={'bufferView':len(views)-1,'componentType':component,'count':len(a),'type':kind}
 if kind=='VEC3':obj.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 acc.append(obj);return len(acc)-1
for file in ['assets/skeletal-atlas.glb','assets/muscular/anatomical-muscles.glb']:
 raw=(ROOT/file).read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);data=raw[28+n:]
 def read(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dtype=np.dtype({5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);width={'SCALAR':1,'VEC3':3}[a['type']]
  value=np.ndarray((a['count'],width),dtype=dtype,buffer=data,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dtype.itemsize),dtype.itemsize)).astype(float)
  if a.get('normalized'):value/=np.iinfo(dtype).max
  return value
 for node in g['nodes']:
  name=node['name'];lower=name.lower()
  if 'left' not in lower or not any(s in lower for s in ['humerus','radius','ulna','scapula','clavicle','biceps','triceps']):continue
  part='biceps' if 'biceps' in lower else 'triceps' if 'triceps' in lower else 'bones'
  prims=[]
  for p in g['meshes'][node['mesh']]['primitives']:
   pos=read(p['attributes']['POSITION'])*np.array(node.get('scale',[1,1,1]))+np.array(node.get('translation',[0,0,0]));pos=((pos-ELBOW)@ROT.T).astype('<f4')
   if 'NORMAL' in p['attributes']:normals=(read(p['attributes']['NORMAL'])@ROT.T).astype('<f4')
   else:
    ix=read(p['indices']).astype(int).reshape(-1,3) if 'indices' in p else np.arange(len(pos)).reshape(-1,3);normals=np.zeros_like(pos);faces=np.cross(pos[ix[:,1]]-pos[ix[:,0]],pos[ix[:,2]]-pos[ix[:,0]])
    for col in range(3):np.add.at(normals,ix[:,col],faces)
    normals/=np.maximum(1e-9,np.linalg.norm(normals,axis=1,keepdims=True))
   indices=read(p['indices']).astype('<u4').reshape(-1,3) if 'indices' in p else np.arange(len(pos),dtype='<u4').reshape(-1,3)
   if part!='bones':
    indices=indices[pos[indices].mean(axis=1)[:,1]>=.075];used,inverse=np.unique(indices,return_inverse=True);pos=pos[used];normals=normals[used];indices=inverse.astype('<u4').reshape(-1,3)
   attrs={'POSITION':pack(pos,'VEC3',5126),'NORMAL':pack(normals,'VEC3',5126)}
   out={'attributes':attrs,'material':0 if part=='bones' else 1 if part=='biceps' else 2,'indices':pack(indices.reshape(-1),'SCALAR',5125)}
   prims.append(out)
  nodes.append({'name':name,'mesh':len(meshes),'extras':{'part':part,'forearm':any(s in lower for s in ['radius','ulna'])}});meshes.append({'primitives':prims})
out={'asset':{'version':'2.0','copyright':'BodyParts3D © DBCLS, CC BY-SA 2.1 Japan. Adapted for InnerU.'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(blob)}],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'roughnessFactor':.65,'metallicFactor':0}} for color in [[.88,.82,.68,1],[.78,.40,.33,1],[.69,.35,.32,1]]]}
j=json.dumps(out,separators=(',',':')).encode();j+=b' '*((-len(j))%4);blob.extend(b'\0'*((-len(blob))%4));dest=ROOT/'assets/muscular/movement-arm.glb';dest.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(j)+len(blob))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(blob),b'BIN\0')+blob)
print(dest,len(blob),'bytes',len(nodes),'anatomical meshes')
for label,v in [('radius insertion',[.44843,.30154,-.00007]),('olecranon',[.41694,.40494,-.04686])]:print(label,((np.array(v)-ELBOW)@ROT.T).round(5).tolist())
