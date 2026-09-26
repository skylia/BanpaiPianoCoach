// Private imported audio never goes to the server, progress backups, or Git.
const DB_NAME = 'banpai-human-demos-v1';
let opening;
function database() {
  if (!opening) opening = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {reject(Error('浏览器无法保存录音。')); return;}
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', {keyPath: 'scoreId'});
    request.onsuccess = () => {const db = request.result; db.onversionchange = () => {db.close(); opening = null;}; resolve(db);};
    request.onerror = () => {opening = null; reject(Error('本机录音存储不可用，请检查浏览器权限。'));};
    request.onblocked = () => {opening = null; reject(Error('请关闭其他半拍页面后再试。'));};
  });
  return opening;
}
export async function readLocalDemo(scoreId) {
  const db = await database();
  return new Promise((resolve, reject) => {const request = db.transaction('recordings').objectStore('recordings').get(scoreId); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(Error('读取本机录音失败。'));});
}
export async function saveLocalDemo(record) {
  const db = await database();
  return new Promise((resolve, reject) => {const transaction = db.transaction('recordings', 'readwrite'); transaction.oncomplete = () => resolve(); transaction.onerror = transaction.onabort = () => reject(Error('录音保存失败，浏览器空间可能不足；原录音仍保留。')); transaction.objectStore('recordings').put(record);});
}
export async function removeLocalDemo(scoreId) {
  const db = await database();
  return new Promise((resolve, reject) => {const transaction = db.transaction('recordings', 'readwrite'); transaction.oncomplete = () => resolve(); transaction.onerror = transaction.onabort = () => reject(Error('录音未能移除，请重试。')); transaction.objectStore('recordings').delete(scoreId);});
}
