import {defineConfig} from 'vite';

// A relative base serves both https:// websites and the installed
// Windows Electron file:// game without referencing remote resources.
export default defineConfig({
 base:'./',
 build:{outDir:'dist',emptyOutDir:true},
});
