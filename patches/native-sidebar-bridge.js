/* moo-x-native-sidebar-bridge-v1; VS Code 1.139.0 / 2242ebbb54efeeb0129e08e919e7e8d43033cd83 */
(()=>{
  let state;
  qe.registerCommand('_mooXBrowser.nativeSidebar', async (accessor, action) => {
    if (!['show','hide','back','home','reload','destroy','status'].includes(action)) throw new Error('Unknown X sidebar action');
    if (!state) {
      if (action !== 'show') return {visible:false};
      const service = accessor.get(Jl), views = accessor.get(oi);
      let model, lazy, creating;
      let visible = false, disposed = false, busy = false, timer;
      let lastRect = '', lastVisible = false;
      const mobileDevice = {
        mobile:true, deviceScaleFactor:0, mooMouseHover:true,
        userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
      };
      const keyHandlers = new Map();
      const attachKeys = browser => {
        if (keyHandlers.has(browser.id)) return;
        keyHandlers.set(browser.id, browser.onDidKeyCommand(event => {
          if (event.code === 'KeyX' && event.metaKey && event.altKey && !event.ctrlKey && !event.shiftKey && !event.repeat) {
            void accessor.get(be).executeCommand('mooXBrowser.toggle').catch(report);
          }
        }));
      };
      const stack = [];
      const members = new Set();
      const report = error => console.error('[X sidebar]', error);
      const getPane = () => views.getViewWithId('mooXBrowser.view');
      const ensureModel = async () => {
        if (model) return model;
        if (creating) return creating;
        creating = (async()=>{
          const scope = await service._resolveStorageScope();
          lazy = await service.createBrowserView({owner:{type:'user'},session:{scope}}, undefined);
          model = await lazy.resolve(); if(disposed){lazy.dispose(true);throw new Error('Sidebar disposed while opening');} members.add(model.id);attachKeys(model);
          await model.setDevice({...mobileDevice});
          void model.loadURL('https://x.com/home').catch(report);
          return model;
        })().finally(()=>{creating=undefined;});
        return creating;
      };
      const hasOverlay = () => [...document.querySelectorAll('.quick-input-widget, .monaco-dialog-box, .context-view .monaco-menu')].some(el=>el.getBoundingClientRect().height>0 && getComputedStyle(el).visibility!=='hidden');
      const tick = async () => {
        clearTimeout(timer);
        if (disposed) return;
        if (busy) {timer=setTimeout(tick,100);return;}
        busy=true;
        try {
          const pane=getPane(), container=pane?._container;
          const rect=container?.getBoundingClientRect();
          let show=!!(visible && pane?.isBodyVisible() && container?.isConnected && rect?.width>1 && rect?.height>1 && !hasOverlay());
          if (show) {await ensureModel();show=visible && !disposed && pane.isBodyVisible();}
          if (model) {
            if (show) {
              const layout={windowId:ht.vscodeWindowId,x:rect.left,y:rect.top,width:rect.width,height:rect.height,zoomFactor:kv(window),cornerRadius:0,emulation:{scale:1}};
              const key=JSON.stringify(layout);
              if (key!==lastRect) {await model.layout(layout);lastRect=key;}
            }
            if (show!==lastVisible) {await model.setVisible(show);lastVisible=show;}
          }
        } catch(error) {report(error);}
        finally {busy=false;if(!disposed && visible)timer=setTimeout(tick,100);}
      };
      const handler=service.registerOpenHandler({shouldOpenEditor(child,owner,options){
        if(!options?.parentViewId || !members.has(options.parentViewId)) return true;
        void (async()=>{
          const next=await child.resolve();
          await next.setDevice({...mobileDevice});
          if(disposed){child.dispose(true);return;}
          if(model){await model.setVisible(false);stack.push({model,lazy});}
          model=next;lazy=child;members.add(next.id);attachKeys(next);lastRect='';lastVisible=false;await tick();
        })().catch(report);
        return false;
      }});
      state={async run(command){
        if(command==='show'){visible=true;await tick();return{visible:lastVisible};}
        if(command==='hide'){visible=false;if(model)await model.setVisible(false);lastVisible=false;return{visible:false};}
        if(command==='reload'){if(model)await model.reload(true);return;}
        if(command==='back'){
          if(model?.canGoBack){await model.goBack();return;}
          if(stack.length){if(model){members.delete(model.id);await model.setVisible(false);lazy?.dispose(true);}const prev=stack.pop();model=prev.model;lazy=prev.lazy;lastRect='';lastVisible=false;await tick();}
          else if(model)await model.goBack();return;
        }
        if(command==='home'){await ensureModel();await model.loadURL('https://x.com/home');return;}
        if(command==='status')return{visible:lastVisible,created:!!model,viewId:model?.id};
        if(command==='destroy'){
          disposed=true;visible=false;clearTimeout(timer);handler.dispose();
          const entries=[...stack,{model,lazy}];
          for(const entry of entries)if(entry.model){await entry.model.setVisible(false);entry.lazy?.dispose(true);}
          for(const handler of keyHandlers.values())handler.dispose();keyHandlers.clear();
          members.clear();state=undefined;return;
        }
      }};
    }
    return state.run(action);
  });
})();
