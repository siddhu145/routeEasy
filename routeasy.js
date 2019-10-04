class RouteEasy {

    constructor(routes,cb = {}){
        this.cssFiles = []; this.jsFiles = []; this.vars = {};
        this.interceptLinks(); this.interceptPop(); 
        this.postLoad = cb.postLoad ? cb.postLoad : ()=> {};
        this.preLoad = cb.preLoad ? cb.preLoad : ()=> {};
        this.lazyLoadAdvance = cb.imageLoadAdvance ? cb.imageLoadAdvance : 300;
        this.routes = routes;
        this.paths = Object.keys(routes);
        this.getTheme();
        window.addEventListener('scroll', ()=>{ this.lazyLoad(); });
        window.addEventListener('resize', ()=>{ this.lazyLoad(); });
        
    }

    getParams(){
        let prm = (new URL(document.location)).searchParams;
        let po = {};
        for(var pair of prm.entries()) {
            po[pair[0]] = pair[1];
        }
        return po;
    }

    getTheme(path){
        if(!path) path = window.location.pathname;
        // console.log('Path to get',path);
        if(this.routes[path]){
            this.currentRoute = this.routes[path];
        } else{
            this.getRouteKey()
        }
        // console.log(this.currentRoute);
        this.params = this.getParams();
        this.loadTheme();       
    }

    getRouteKey(){
        let pc = this.paths.length; 
        let foundPath = false; 
        for(let i=0; i<pc; i++){
            if(foundPath) break;
            this.vars = {};
            let pt = this.paths[i];
            if(pt.indexOf(':') > -1){
                let reqPath = window.location.pathname.split('/');
                let matchPath = pt.split('/');
                // console.log(reqPath,matchPath);
                if(reqPath.length == matchPath.length){
                    this.currentRoute = this.routes[pt];
                    foundPath = true;
                    // console.log('found a lead');
                    matchPath.forEach((p,ind)=> {
                        if(p.indexOf(':') == 0){
                            let k = p.substr(1);
                            this.vars[k] = reqPath[ind];
                        } else if(p != reqPath[ind]){
                            foundPath = false;
                        }
                    });
                }
            } 
        }
        // console.log(foundPath);
        if(!foundPath){
            this.currentRoute = this.routes['/_default_'];
        }
    }

    loadTheme(){
        this.loadPage();
        this.loadCss();
    }

    removeJs(){
        let scripts = this.jsFiles;
        this.jsFiles = [];
        scripts.forEach(file=>{
            let src = `[src="${file}"]`;
            let js = document.querySelector(src);
            document.body.removeChild(js);
        });
        this.loadScript = true;
    }

    loadPage(){
        let tmp = this.currentRoute.template;
        // if(this.preLoad(this) === false){
        //     return;
        // }
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; 
        this.preLoad();
        fetch(tmp)
        .then( r=> {
           if(r.status == 200){
                return  r.text();
           } 
           else{
                return 'Networ error try again';
           }
        })
        .then(r=>{
            // console.log('got page');
            pageContent.innerHTML = r;
            this.removeJs();
            this.loadJs();
            // console.log(this.currentRoute);
            if(this.currentRoute.init){
                // console.log(this.currentRoute.init);
                this.currentRoute.init();
            }  
            this.postLoad(this);
            this.lazyLoad();
                
        });
    }

    loadJs(){
        let js =  this.currentRoute.js;
        if(js){
            for(let i=0;i<js.length;i++){
                this.createScript(js[i]);
            }
        }
    }

    createScript(src){
        let script = document.createElement('script');
        // script.onload = function(){}
        script.src = src;
       
        document.body.appendChild(script);
        this.jsFiles.push(src);
    }

    loadCss(){
        let css = this.currentRoute.css;
        if(css){
            for(let i=0;i<css.length;i++){
                this.createCss(css[i]);
            }
        }
    }

    createCss(href){
        if(this.cssFiles.indexOf(href) < 0){
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
            this.cssFiles.push(href);
        }
    }


    lazyLoad() {
        console.log('lazy load')
        let lazyImages = [...document.querySelectorAll('.lazy-image')];
        let inAdvance = this.lazyLoadAdvance;
        if(lazyImages.length == 0){
            return;
        }
        lazyImages.forEach(image => {
            if (image.getBoundingClientRect().top < window.innerHeight + window.pageYOffset + inAdvance) {
                if(!image.classList.contains('loaded')){
                    image.src = image.dataset.src;
                    image.onload = () => { image.classList.add('loaded'); image.classList.remove('lazy-image')};
                }
            }
        });
    }

    /**lINK INTERCEPTION CODE */
    interceptLinks(){
        let self = this;
        document.addEventListener('click',(event)=>{
            let aEle = event.target.closest("a");
            if(aEle){
                if(aEle.hostname == window.location.hostname){
                    let path = aEle.getAttribute('href');
                    // if(path.indexOf('.') > -1) return;
                    if("#" != path && path.indexOf('#') != 0 ){
                        event.preventDefault();
                        if(path.indexOf('http') == 0){
                            path = aEle.pathname;
                        }
                        if(path.indexOf('/') != 0) path = '/'+path;
                        window.history.pushState({path:path},'',path);
                        self.getTheme(path);
                    }
                    
                }
            }
        });
    }

    redirect(path){
        window.history.pushState({path:path},'',path);
        this.getTheme(path);
    }

    interceptPop(){
        let self = this;
        console.log(self.hrefPath);
        if("#" != self.hrefPath){
            window.addEventListener('popstate', (event) => {
                // console.log(event.state);
                if(event.state){
                    self.getTheme(event.state.path);
                } else{
                    self.getTheme('/');
                }
            });
        }
        
    }

}

