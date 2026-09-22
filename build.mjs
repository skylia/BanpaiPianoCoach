import {cpSync,rmSync,mkdirSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});cpSync('public','dist',{recursive:true});console.log('Static production build: dist/');
