"""Build missing, registered BodyParts3D surface segments. NumPy is asset-build only.
The input directory contains the pinned OBJ exports listed in HEART-STUDIO.md.
No downloads, credentials, application data or changes to the credited base GLB.
"""
import argparse,hashlib,json,struct
from pathlib import Path
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,default=Path('assets/heart-surface-details.glb'));a=parser.parse_args()
ids={'FJ2649':'lcx','FJ2650':'lcx','FJ2651':'lcx','FJ2653':'lcx','FJ2654':'lcx',**{f'FJ{i}':'greatvein' for i in [2656,2658,2659,2660,2661,2662,2663,2664,2665]}}
# The base surface export uses centimetre-scale heart coordinates: patient-left X,
# superior Y, anterior Z. A shared LCA mesh verifies registration to <0.00002 units.
scale=.01;offset=np.array([-.1,-12.25,-1.2])
blob=bytearray();views=[];acc=[];meshes=[];nodes=[];provenance=[]
def pack(data,kind,component):
 while len(blob)%4:blob.append(0)
 views.append({'buffer':0,'byteOffset':len(blob),'byteLength':data.nbytes});blob.extend(data.tobytes())
 item={'bufferView':len(views)-1,'componentType':component,'count':len(data),'type':kind}
 if kind=='VEC3':item.update(min=data.min(0).tolist(),max=data.max(0).tolist())
 acc.append(item);return len(acc)-1
for fid,part in ids.items():
 file=a.source/(fid+'.obj');text=file.read_text();positions=[];triangles=[]
 for line in text.splitlines():
  if line.startswith('v '):positions.append([float(v) for v in line.split()[1:4]])
  elif line.startswith('f '):
   face=[int(v.split('/')[0])-1 for v in line.split()[1:]]
   for i in range(1,len(face)-1):triangles.append([face[0],face[i],face[i+1]])
 p=np.array(positions,dtype=float)[:,[0,2,1]]*np.array([1,1,-1])*scale+offset;ix=np.array(triangles,dtype='<u2')
 normal=np.zeros_like(p);face=np.cross(p[ix[:,1]]-p[ix[:,0]],p[ix[:,2]]-p[ix[:,0]])
 for k in range(3):np.add.at(normal,ix[:,k],face)
 normal/=np.maximum(1e-12,np.linalg.norm(normal,axis=1,keepdims=True))
 attrs={'POSITION':pack(p.astype('<f4'),'VEC3',5126),'NORMAL':pack(normal.astype('<f4'),'VEC3',5126)}
 meshes.append({'name':fid,'primitives':[{'attributes':attrs,'indices':pack(ix.reshape(-1),'SCALAR',5123),'material':0 if part=='lcx' else 1}]})
 name=next(l.split(':',1)[1].strip() for l in text.splitlines() if l.startswith('# English name'))
 nodes.append({'name':fid,'mesh':len(meshes)-1,'extras':{'heartId':part,'ids':[part,'coronary'],'sourceId':fid,'sourceName':name}})
 provenance.append({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sourceName':name})
doc={'asset':{'version':'2.0','copyright':'BodyParts3D © DBCLS, CC BY-SA 2.1 Japan. Registered surface additions for InnerU.'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'roughnessFactor':.5,'metallicFactor':0},'doubleSided':True} for color in [[.6,.08,.1,1],[.1,.32,.42,1]]],'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(blob)}],'extras':{'provenance':provenance,'sourceRevision':'jixiangying/anatomy@be67a977abe25a36f59793fda86a506618fd4d27','registration':{'scale':scale,'offset':offset.tolist(),'axisOrder':'x,z,-y'}}}
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);blob+=b'\0'*((-len(blob))%4)
a.output.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(j)+len(blob))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(blob),b'BIN\0')+blob)
print(a.output,a.output.stat().st_size,'bytes',len(nodes),'source segments')
