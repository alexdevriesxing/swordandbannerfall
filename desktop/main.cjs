'use strict';
const {app,BrowserWindow,session}=require('electron');
const {join}=require('node:path');
const {pathToFileURL}=require('node:url');
const {isTrustedNavigation,isOfflineAssetRequest}=require('./security.cjs');

// Built dist/ is bundled inside the local, DRM-free installer.
// No ads, telemetry, browser navigation, remote code or online dependencies.
const gameIndex=join(__dirname,'..','dist','index.html');
const trustedURL=pathToFileURL(gameIndex).href;

app.whenReady().then(()=>{
 session.defaultSession.webRequest.onBeforeRequest((request,callback)=>{
  callback({cancel:!isOfflineAssetRequest(request.url)});
 });
 const window=new BrowserWindow({
  title:'Sword & Bannerfall',
  width:1280,height:760,
  minWidth:960,minHeight:600,
  backgroundColor:'#101722',
  autoHideMenuBar:true,
  show:false,
  webPreferences:{
   nodeIntegration:false,
   contextIsolation:true,
   sandbox:true,
   webSecurity:true,
   webviewTag:false,
   devTools:false
  }
 });
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{
  if(!isTrustedNavigation(url,trustedURL))event.preventDefault();
 });
 window.once('ready-to-show',()=>window.show());
 window.loadFile(gameIndex).catch(error=>{
  console.error('Offline game could not load:',error.message);
  app.quit();
 });
});

app.on('window-all-closed',()=>app.quit());
