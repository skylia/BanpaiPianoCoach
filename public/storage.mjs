const DB_NAME='banpai-studio-v2';let opening;
export async function openDatabase(){
 if(!opening)opening=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,2);req.onupgradeneeded=()=>{const db=req.result;for(const name of ['scores','takes','activities','settings'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});};req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();opening=null;};resolve(req.result);};req.onerror=()=>{opening=null;reject(new Error('浏览器未允许保存数据。请导出留存，或在普通浏览窗口重试。'));};req.onblocked=()=>{opening=null;reject(new Error('请关闭其他打开的半拍页面，再刷新以升级进度存档。'));};});
 return opening;
}
export async function readAll(store){const db=await openDatabase();return new Promise((resolve,reject)=>{const req=db.transaction(store).objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function writeBatch(operations){const db=await openDatabase();if(!operations.length)return;return new Promise((resolve,reject)=>{const tx=db.transaction([...new Set(operations.map(o=>o.store))],'readwrite');tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(new Error('保存失败，浏览器存储空间可能不足。请先导出重要数据。'));try{for(const o of operations){const s=tx.objectStore(o.store);if(o.type==='clear')s.clear();else if(o.type==='delete')s.delete(o.id);else s.put(structuredClone(o.value));}}catch(error){tx.abort();reject(error);}});}
export const putRecord=(store,value)=>writeBatch([{store,value}]);
export const deleteRecord=(store,id)=>writeBatch([{store,type:'delete',id}]);
export const clearRecords=store=>writeBatch([{store,type:'clear'}]);
export const saveTake=(take,activity)=>writeBatch([{store:'takes',value:take},...(activity?[{store:'activities',value:activity}]:[])]);
export const clearPracticeData=()=>writeBatch([{store:'takes',type:'clear'},{store:'activities',type:'clear'}]);
