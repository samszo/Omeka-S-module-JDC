class jdc {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'jdc0';
        this.idExi = 0;
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.fctClickDim = params.fctClickDim ? params.fctClickDim : showDetail;
        this.fctCreaDim = params.fctCreaDim ? params.fctCreaDim : console.log;
        this.data = params.data ? params.data : false;
        this.hierarchies = {};
        this.dataTest = {
            "Existence":[{
                "id":0,
                "dateCreation": "03/08/2021",
                "auteur": "samszo",
                "o:title": "JDC exemple",
                "urlAdmin": "../",
                "@id": "http://localhost/omk_jdc/api/items/2"
            }],
            "Physique":{"children": [
                {"id": 1,"o:title": "vide", "children":[
                    {"id": 11,"o:title": "vide 11","children":[
                        {"id": 111,"o:title": "vide 111","value":1}    
                        ,{"id": 112,"o:title": "vide 112","value":1}    
                        ,{"id": 113,"o:title": "vide 113","children":[
                            {"id": 1131,"o:title": "vide 1131","value":1}    
                            ,{"id": 1132,"o:title": "vide 1132","value":1}    
                        ]}    
                    ]}    
                    ,{"id": 12,"o:title": "vide 12","children":[
                        {"id": 121,"o:title": "vide 121","value":1}    
                        ,{"id": 122,"o:title": "vide 122","value":1}    
                    ]}    
                    ,{"id": 13,"o:title": "vide 13","value":1}    
                ]},
                {"id": 2,"o:title": "vide 2", "children":[
                        {"id": 21,"o:title": "vide 21","children":[
                            {"id": 211,"o:title": "vide 211","value":1}    
                            ,{"id": 212,"o:title": "vide 212","value":1}    
                        ]}    
                        ,{"id": 22,"o:title": "vide 22","children":[
                            {"id": 221,"o:title": "vide 221","value":1}    
                            ,{"id": 222,"o:title": "vide 222","value":1}    
                        ]}    
                        ,{"id": 23,"o:title": "vide 23","value":1}    
                ]},
                ]},
            "Actant": {"children":[
                {
                "id": 2,
                "o:title": "vide",
                },
                {
                "id": 21,
                "o:title": "vide 2",
                },
                {
                "id": 22,
                "o:title": "vide 3",
                },
                {
                "id": 23,
                "o:title": "vide 4",
                },
                {
                "id": 24,
                "o:title": "vide 5",
                },
                {
                "id": 25,
                "o:title": "vide 6",
                },
            ]},
            "Concept": {"children":[
                {"id": 1,"o:title": "vide", "value":1, "children":[
                    {"id": 11,"o:title": "vide 11", "value":1, "children":[
                        {"id": 111,"o:title": "vide 111","value":1}    
                        ,{"id": 112,"o:title": "vide 112","value":1}    
                        ,{"id": 113,"o:title": "vide 113","value":1, "children":[
                            {"id": 1131,"o:title": "vide 1131","value":1}    
                            ,{"id": 1132,"o:title": "vide 1132","value":1}    
                        ]}    
                    ]}    
                    ,{"id": 12,"o:title": "vide 12","value":1, "children":[
                        {"id": 121,"o:title": "vide 121","value":1}    
                        ,{"id": 122,"o:title": "vide 122","value":1}    
                    ]}    
                    ,{"id": 13,"o:title": "vide 13","value":1}    
                ]},
                {"id": 2,"o:title": "vide 2","value":1, "children":[
                    {"id": 21,"o:title": "vide 21","value":1,"children":[
                        {"id": 211,"o:title": "vide 211","value":1}    
                        ,{"id": 212,"o:title": "vide 212","value":1}    
                    ]}    
                    ,{"id": 23,"o:title": "vide 23","value":1,"value":1}    
                ]},
            ]},
            "Rapport": {"children":[
                //l'ordre est important
                //le sujet est toujours actant
                //l'objet est toujours physique
                //le prédicat est toujours concept
                {"id": 4,
                "o:title": "test",
                "nodes": [
                    {'rdf':"sujet",'dim':'Actant','id':23},
                    {'rdf':"objet",'dim':'Physique','id':1131},
                    {'rdf':"predicat",'dim':'Concept','id':212},
                ]},
                {"id": 5,
                "o:title": "test 5",
                "nodes": [
                    {'rdf':"sujet",'dim':'Actant','id':22},
                    {'rdf':"objet",'dim':'Physique','id':212},
                    {'rdf':"predicat",'dim':'Concept','id':13},
                ]},
            ]}
        }; 

        let svg, svgBBox, container, dimsBand, physiqueBand, toolTipAjoutRapport, dimSelect, rdfTriplet = ['Sujet', 'Objet', 'Predicat'], rapportDims=[];            

        this.init = function () {
            
            svg = this.cont.append("svg").attr("width", me.width+'px').attr("height", me.height+'px');
            svgBBox = svg.node().getBoundingClientRect();
            //création du conteneur pour le graph
            container = svg.append("g");                
            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );
            //me.data = me.dataTest;
            if(me.data)me.setData();
                     
        }
        this.setData = function(){
            //construction des hiérarchies
            me.hierarchies = {
                "Physique" : d3.hierarchy(me.data.Physique)
                ,"Actant" : d3.hierarchy(me.data.Actant)
                ,"Concept" : d3.hierarchy(me.data.Concept)
            }
            //construction des espaces dimensionnels
            let dimsEsp = Object.keys(me.hierarchies);
            let dimsColor = d3.scaleOrdinal(dimsEsp, d3.schemePastel2);
            dimsBand = d3
                .scaleBand()
                .domain(dimsEsp)
                .paddingInner(0.2) // edit the inner padding value in [0,1]
                .paddingOuter(0.2) // edit the outer padding value in [0,1]                
                .range([0, me.height]);            
            let dimsG = container.selectAll('.jdcDim').data(dimsEsp).enter()
                .append('g').attr('id',d=>'dimsG_'+me.id+'_'+d).attr('class','dimsG')
                .style("display", "none");

            dimsG.append('rect')
                    .attr('id',d=>'dimsRect_'+me.id+'_'+d)
                    .attr('class','dimsRect')
                    .attr('width',me.width)
                    .attr('height',d=>d=='Rapport' ? me.height : dimsBand.bandwidth())
                    .attr('x',0)
                    .attr('y',d=>d=='Rapport' ? 0 : dimsBand(d))
                    .attr('fill',d=>dimsColor(d))                                         
                    .attr('fill-opacity','0.5');                                         
            dimsG.append('text')
                .attr('id',d=>'dimsText_'+me.id+'_'+d)
                .attr('class','dimsText')
                .attr('x',d=>d=='Rapport' ? me.width/2 : 6)
                .attr('y',d=>d=='Rapport' ? 12 : dimsBand(d)+dimsBand.bandwidth()/2)
                .text(d=>d);

            //ajoute une intériorité globale
            container.append("rect")
                .attr('id','ConceptEllipse_'+me.id)
                .attr('class','ConceptEllipse')
                .attr('x',0)
                .attr('y',dimsBand('Concept')-dimsBand.bandwidth()/2)
                .attr('width',me.width)
                .attr('height',dimsBand.bandwidth()+dimsBand.bandwidth()/2)
                .attr('rx',dimsBand.bandwidth()/2)
                .attr('ry',dimsBand.bandwidth()/2)
                .attr("stroke-width", 2)                
                .attr("stroke", 'black')
                .attr("fill", 'black')
                .attr('fill-opacity','0.3');                      


            //construction des dimensions
            addConcepts();
            addActants();
            addPhysiques();
            addRapports();
            addExistences();   
        }
        //récupère l'identifiant du root de la hiérarchie   
        function getRootHierarchy(d){
            //récupère le noeud root
            let a = d.ancestors();
            let root = a[a.length-1];
            //renvoie le noeud du treemap   
            return root.data.id;
        }

        function clickDim(e,d){
            me.fctClickDim(e,d);
        }

        function showDetail(e,d){
            console.log(e,d);
            if(!d.modal){
                //merci à https://stephanwagner.me/jBox/documentation
                d.modal = new jBox('Modal', {
                    title: '---',
                    overlay: false,
                    draggable: 'title',
                    repositionOnOpen: true,
                    repositionOnContent: true,
                    target: '#'+e.currentTarget.id,
                    position: {
                        x: 'left',
                        y: 'top'
                    },
                    title:d.data ? d.data['o:title'] : d['o:title'],
                    content:getModalContent(d)
                })
            }
            d.modal.open();            
        }

        function getModalContent(d){
            let dt = d.data ? d.data : d;
            return `<iframe 
            width="600"
            height="600"
            src="${user ? dt.adminUrl : dt.siteUrl}"></iframe>`;//ATTENTION user définie dans le thème JDC

        }

        function addExistences(){
            me.idExi = me.data.Existence[0].id;
            let fs = 32;
            let existenceG = container.selectAll('.jdcExitenceG').data(me.data.Existence).enter()
                .append('g').attr('id',e=>'jdcExistenceG_'+me.id+'_'+e.id).attr('class','jdcExitenceG')
                .attr("transform", `translate(0,${fs})`)
                .on('click',showDetail);
            let existenceT = existenceG.append('text')
                .attr("x", 0)
                .attr("y", 0)                
                .attr("font-size",fs);
            existenceT.append("tspan")
                .text(e=>e['o:title']);
        }


        function addRapports(){
            if(!me.data.Rapport.children.length)return;
            //définition des positions des noeuds de contact avec les dimensions
            //physique = autant de bandes que d'actant chaque bandes a autant de bande que de rapport 
            let scalePhy = d3.scaleBand()
            .domain(me.data.Actant.children.map(d=>d.id))
            .paddingInner(0.5) // edit the inner padding value in [0,1]
            .paddingOuter(0.5) // edit the outer padding value in [0,1]                
            .range([0, physiqueBand.bandwidth()])
            .align(0.5);
            //construction des datas
            me.data.Rapport.children.forEach(r=>{
                //récupère les positions
                let nActant, nActantBas, nPhysiqueBas, nConceptHaut, nPosi, nbNode = r.nodes.length, marge;
                r.links = [];
                for (let index = 0; index < nbNode; index++) {
                    let n = r.nodes[index];
                    if(n.dim=='articulation'){
                        r.nodes.splice(index, 1);
                    }else{
                        n.path = dimNodePath(n);
                        dimNodePosi(n);
                        switch (n.dim) {
                            case 'Actant':
                                nActant = n;
                                //on ajoute un noeud en bas de l'exagone suivant le nombre de lien
                                nActantBas = JSON.parse(JSON.stringify(n));
                                nActantBas.posi.y += dimsBand.bandwidth();
                                nActantBas.dim = 'articulation'
                                r.nodes.push(nActantBas);
                                break;                    
                            case 'Physique':
                                //on ajoute un noeud en bas du rectangle dans la bande qui correspond
                                nPhysiqueBas = JSON.parse(JSON.stringify(n));
                                marge = dimsBand.step()-dimsBand.bandwidth();
                                nPhysiqueBas.posi.y = dimsBand('Physique')+dimsBand.bandwidth()+svgBBox.y;//nPhysiqueBas.posi.y+nPhysiqueBas.posi.height;//+svgBBox.y-marge;
                                nPhysiqueBas.posi.x = physiqueBand(n.dataRoot.id)+scalePhy(nActant.id)+svgBBox.x;
                                nPhysiqueBas.dim = 'articulation'
                                r.nodes.push(nPhysiqueBas);
                                r.links.push({'source':nActant.posi, 'target':nPhysiqueBas.posi, 'id':nActant.id+'_'+n.id}); 
                                r.links.push({'source':nPhysiqueBas.posi, 'target':n.posi, 'id':nActant.id+'_'+n.id}); 
                                break;                    
                            case 'Concept':
                                //on ajoute un noeud en haut du cercle
                                nConceptHaut = JSON.parse(JSON.stringify(n));
                                nConceptHaut.posi.y = dimsBand('Concept')+svgBBox.y;//nPhysiqueBas.posi.y+nPhysiqueBas.posi.height;//+svgBBox.y-marge;
                                nConceptHaut.dim = 'articulation'
                                r.nodes.push(nConceptHaut);
                                //déplace l'arrivé du lien sur le cercle du noeud                            
                                nPosi = JSON.parse(JSON.stringify(n.posi));
                                nPosi.y -= nPosi.height/2
                                r.links.push({'source':nActantBas.posi, 'target':nConceptHaut.posi, 'id':nActant.id+'_'+n.id}); 
                                r.links.push({'source':nConceptHaut.posi, 'target':nPosi, 'id':nActant.id+'_'+n.id}); 
                                break;                    
                        }
                    }
                };
            })

                
            let RapportG = container.selectAll('.jdcRapportG').data(me.data.Rapport.children).enter()
                .append('g').attr('id',r=>'jdcRapportG_'+me.id+'_'+r.id).attr('class','jdcRapportG')
                .attr("transform", `translate(${-svgBBox.x},${-svgBBox.y})`)
                .on('click',clickDim);
                
                
            //draw circles for the links 
            let RapportNodes = RapportG.selectAll("circle").data(d=>d.nodes).enter()
                    .append("circle")
                    .attr('id',n=>'jdcRapportN_'+me.id+'_'+n.id)
                    .attr("cx", n=>n.posi.x)
                    .attr("cy", n=>n.posi.y)
                    .attr("r", n=>n.dim=='Concept' ? n.posi.height/2 : 4)
                    .attr("stroke-width", 1)
                    .style("stroke", 'black')
                    .attr("fill", n=>n.dim=='Concept' ? 'none' : 'black')
                    .append("title")
                        .text(n =>{
                            return n.rdf+' - '+n.dim+' = '+n.id+' - '+n.data['o:title'];
                        });  
            //draw lines for the links 
            let RapportLinks = RapportG.selectAll("line").data(d=>d.links).enter()
                .append("line")
                .attr('id', l =>'jdcRapportL_'+me.id+'_'+l.id)
                .attr("x1", l => l.source.x)
                .attr("y1", l =>  l.source.y)
                .attr("x2", l =>  l.target.x)
                .attr("y2", l =>  l.target.y)
                .attr("stroke-width", 2)
                .style("stroke", 'black');  

            function dimNodePath(n){
                let path;
                switch (n.dim) {
                    case 'Physique':
                        path = "#physiqueNode_"+me.id+'_'+n.id;
                        break;                
                    case 'Actant':
                        path = '#jdcActantG_'+me.id+'_'+n.id;
                        break;                
                    case 'Concept':
                        path = '#conceptG_'+me.id+'_'+n.id;
                        break;                
                    }
                return path;
            }
            function dimNodePosi(n){
                //retrouve le noeud dans la hiérarchies
                let nf = me.hierarchies[n.dim].find(d=>d.data.id==n.id);
                //recherche le parent qui a un noeud graphique
                if(nf){
                    let iRoot = nf.ancestors().length-2;
                    nf.ancestors().forEach((nfa,i)=>{
                        if(i==0)n.data=nfa.data
                        let path = dimNodePath({'dim':n.dim,'id':nfa.data.id});
                        if(i==iRoot){
                            n.dataRoot=nfa.data;
                            n.posiRoot = d3.select(path).node().getBoundingClientRect();
                        }                        
                        if(!n.posi && d3.select(path).node()){
                            n.pathVisible = path;
                            n.dataVisible = nfa.data;
                            let nVisible = d3.select(path).node(); 
                            n.posi=nVisible.getBoundingClientRect();//.getBBox();//
                            //corrige les positions                            
                            let bbox=nVisible.getBBox();
                            switch (n.dim) {
                                case 'Actant':
                                    n.posi.x += bbox.width/2;
                                    //n.posi.y += bbox.height/2;            
                                    break;
                                case 'Physique':
                                    n.posi.x += bbox.width/2;
                                    //déplace l'arrivé du lien sur le bas du rectangle                            
                                    n.posi.y += bbox.height;            
                                    break;
                                default:
                                    n.posi.x += bbox.width/2;
                                    n.posi.y += bbox.height/2;            
                                    break;                
                            }
            
                        }            
                    })
                }
                if(!n.posi){
                    n.error='noeud introuvable';
                    n.posi = {'x':0, 'y':0};
                }
            }
                    
        }

        function addConcepts(){
            if(!me.data.Concept.children.length)return;
            let ConceptKey = me.data.Concept.children.map(d=>d.id)
            , conceptBand = d3.scaleBand()
                .domain(ConceptKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)
            , ConceptColor = d3.scaleOrdinal(ConceptKey, d3.schemeTableau10)
            , pack = data => d3.pack()
                .size([conceptBand.bandwidth(), dimsBand.bandwidth()])
                .padding(3)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value))
            , roots=[], focus=[], views=[], conceptG=[], nodes=[], labels=[], colors=[]
            ;
                                                  
            me.data.Concept.children.forEach(c=>{
                roots[c.id] = pack(c);
                const hsl = d3.hsl(ConceptColor([c.id]));
                colors[c.id] = d3.scaleLinear()
                    .domain([0, 5])
                    .range(["hsl("+hsl.h+",80%,80%)", "hsl("+hsl.h+",30%,40%)"])
                    .interpolate(d3.interpolateHcl)                
                //ajoute le group de concept
                conceptG[c.id] = container.append('g').attr('id','jdcConceptG_'+me.id+'_'+c.id).attr('class','jdcConceptG');

                //simple circle packing
                const format = d3.format(",d")    
                conceptG[c.id].style("font", "10px sans-serif")
                    .attr("text-anchor", "middle")
                    .attr("transform", `translate(${conceptBand(c.id)},${dimsBand('Concept')})`);
                    ;              

                const node = conceptG[c.id]
                    .selectAll('g.jdcConcept')
                    .data(roots[c.id].descendants())
                    .enter()
                    .append("g")
                    .attr('class','jdcConcept')
                    .attr('id','conceptG_'+me.id+'_'+c.id)
                    .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`)
                    .on('click',clickDim);
                    
                
                node.append("circle")
                    .attr("r", d => d.r)
                    .attr("id", d => 'conceptC_'+me.id+'_'+d.data.id)    
                    .attr("fill", d => colors[c.id](d.depth));
                
                node.append("clipPath")
                    .attr("id", d => d.clipUid = "clip"+d.data.id)
                    .append("use")
                    .attr("xlink:href", d => '#conceptC_'+me.id+'_'+d.data.id);
                    
                node.append("text")
                    .attr("clip-path", d => d.clipUid)
                    .attr("transform", d => d.children ? `translate(0,${d.r-10})` : '')
                    .selectAll("tspan")
                    .data(d => d.data['o:title'].split(/(?=[A-Z][a-z])|\s+/g))
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
                    .text(d => d);

                node.append("title")
                    .text(d => `${d.ancestors().map(d => d.data['o:title']).reverse().join("/")}\n${format(d.value)}`);
    

            });          

        }

  
        function addPhysiques(){
            if(!me.data.Physique.children.length)return;
            let PhysiqueKey = me.data.Physique.children.map(d=>d.id);
            physiqueBand = d3.scaleBand()
                .domain(PhysiqueKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5);            
            let x = d3.scaleLinear()
            , y = d3.scaleLinear().rangeRound([dimsBand('Physique')+30, dimsBand.bandwidth()])
            , name = d => d.ancestors().reverse().map(d => d.data['o:title']).join("/")          
            , format = d3.format(",d")
            , PhysiqueColor = d3.scaleOrdinal(PhysiqueKey, d3.schemeTableau10)
            , treemap           
            , PhysiqueG=[], colors=[];
            me.data.Physique.children.forEach(p=>{
                PhysiqueG[p.id]=container.append('g').attr('id','jdcPhysiqueG_'+me.id+'_'+p.id).attr('class','jdcPhysiqueG');
                const hsl = d3.hsl(PhysiqueColor([p.id]));
                colors[p.id] = d3.scaleLinear()
                    .domain([0, 6])//TODO:calculer la profondeur maximale
                    .range(["hsl("+hsl.h+",80%,80%)", "hsl("+hsl.h+",30%,40%)"])
                    .interpolate(d3.interpolateHcl)                

                //Nested treemap
                treemap = data => d3.treemap()
                    .size([physiqueBand.bandwidth(), dimsBand.bandwidth()]) 
                    .paddingOuter(3)
                    .paddingTop(19)
                    .paddingInner(1)
                    .round(true)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value));

                const root = treemap(p);
                
                PhysiqueG[p.id]
                    .style("font", "10px sans-serif")
                    .attr("transform", `translate(${physiqueBand(p.id)},${dimsBand('Physique')})`);
              
                const node = PhysiqueG[p.id].selectAll("g")
                  .data(d => root.descendants())
                  .join("g")
                    .attr("id", d => "physiqueNode_"+me.id+'_'+d.data.id)
                    .attr("transform", d => `translate(${d.x0},${d.y0})`)
                    .on('click',clickDim);                        

                node.append("title")
                    .text(d => `${d.ancestors().reverse().map(d => d.data['o:title']).join("/")}\n${format(d.value)}`);
              
                node.append("rect")
                    .attr("id", d => d.nodeUid = "physiqueRect_"+me.id+'_'+d.data.id)
                    .attr("fill", d => colors[d.data.id](d.depth))
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0);
              
                node.append("clipPath")
                    .attr("id", d => d.clipUid = "physiqueClip_"+me.id+'_'+d.data.id)
                  .append("use")
                    .attr("xlink:href", d => "#"+d.nodeUid);
              
                node.append("text")
                    .attr("clip-path", d => d.clipUid)
                  .selectAll("tspan")
                  .data(d => d.data['o:title'].split(/(?=[A-Z][^A-Z])/g))
                  .join("tspan")
                    .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                    .text(d => d);
              
                node.filter(d => d.children).selectAll("tspan")
                    .attr("dx", 3)
                    .attr("y", 13);
              
                node.filter(d => !d.children).selectAll("tspan")
                    .attr("x", 3)
                    .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);

              })    

      
        }


        function addActants(){
            if(!me.data.Actant.children.length)return;
            //récupère les clefs des actants
            let ActantKey = me.data.Actant.children.map(d => d.id);
            //attribution des couleurs
            let ActantColor = d3.scaleOrdinal(ActantKey, d3.schemeCategory10);
            me.data.Actant.children.forEach(d=>d.color = d.color ? d.color : ActantColor(d.id))

            let actantBand = d3.scaleBand()
                .domain(ActantKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)            
            , actantG = container.selectAll('.jdcActantG').data(me.data.Actant.children).enter()
                    .append('g').attr('id',d=>'jdcActantG_'+me.id+'_'+d.id).attr('class','jdcActantG')
                .attr("transform", d => `translate(${actantBand(d.id)+actantBand.bandwidth()/2},${dimsBand('Actant')+dimsBand.bandwidth()/2})`)
                .on('click',clickDim)
            , hexbin = d3.hexbin()
                .radius(dimsBand.bandwidth()/2);
            /*ajoute les intériorités
            actantG.append("ellipse")
                .attr('id',d=>'ActantEllipse_'+me.id+'_'+d.id)
                .attr('class','ActantEllipse')
                .attr('cx',d=>actantBand(d.id))
                .attr('cy',dimsBand('Concept')+dimsBand.bandwidth()/4)
                .attr('rx',d=>actantBand.bandwidth())
                .attr('ry',dimsBand.bandwidth()/1.5)
                .attr("stroke-width", 2)                
                .attr("stroke", d=>d.color)
                .attr("fill", d=>d.color)
                .attr('fill-opacity','0.3');
            */                                         
            //ajoute les hexagones
            actantG.append("path")
                .attr('id',d=>'ActantPath_'+me.id+'_'+d.id)
                .attr('class','ActantPath')
                .attr("d", hexbin.hexagon())
                .attr("fill", d=>d.color);
            //ajoute les titres
            actantG.append("clipPath")
                .attr("id", d => d.clipUid = "clip"+d.id)
                .append("use")
                .attr("xlink:href", d => '#ActantPath_'+me.id+'_'+d.id);
            
            actantG.append("text")
                .attr('id',d=>'ActantText_'+me.id+'_'+d.id)
                .attr('class','ActantText')
                .attr("clip-path", d => d.clipUid)
                .selectAll("tspan")
                .data(d => d['o:title'].split(/(?=[A-Z][a-z])|\s+/g))
                .join("tspan")
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
                .attr('text-anchor','middle')
                .text(d=>d);


        }

        this.hide = function(){
          svg.attr('visibility',"hidden");
        }
        this.show = function(){
          svg.attr('visibility',"visible");
        }
        this.removeDim = function(q, r){
            console.log('removeDim',[q,r]);
            container.select('#jdc'+q.dim+'G_'+me.id+'_'+q.idDim).remove();
            for (let index = 0; index < me.data[q.dim].children.length; index++) {
                if (me.data[q.dim].children[index].id==q.idDim)me.data[q.dim].children.splice(index,1);
            }
            me.hierarchies[q.dim]= d3.hierarchy(me.data[q.dim]);        
        }
        this.appendDim = function(q, r){
            console.log('appendDim',[q, r]);
            switch (q.dim) {
                case 'Existence':
                    container.selectAll('g').remove();
                    me.data = r;                    
                    me.setData();                    
                    break;
                default:
                    container.selectAll('.jdc'+q.dim+'G').remove();
                    if(!me.data[q.dim].children)me.data[q.dim].children=[];
                    me.data[q.dim].children = me.data[q.dim].children.concat(r[q.dim]);
                    me.hierarchies[q.dim]= d3.hierarchy(me.data[q.dim]);        
                    eval('add'+q.dim+'s()');
                    break;
            }
        }
        this.clearExi = function(){
            container.selectAll('g').remove();
            container.select('#ConceptEllipse_'+me.id).remove();
            
            me.data = [];                    
        }
        
        this.selectRapportDim = function(e,d){
            if(!e){
                rapportDims = [];
                rdfTriplet.forEach(t=>rapportDims.push({'t':t,'d':false,'tt':false}));
                dimSelect=0;
                me.fctClickDim = me.selectRapportDim
                toolTipAjoutRapport = $("#"+params.idCont).jBox('Mouse', {
                    theme: 'TooltipDark',
                    content: 'Choisissez un '+rapportDims[dimSelect].t
                  });                
            }
            if(d){
                let nDim = d3.select(e.currentTarget);
                nDim.attr('style','animation:colorChange 1s infinite;');
                rapportDims[dimSelect].d=d.data ? d.data : d;
                rapportDims[dimSelect].tt=new jBox('Tooltip',{
                    target: '#'+e.currentTarget.id,
                    position: {
                        x: 'center',
                        y: 'top'
                    },
                    content:rapportDims[dimSelect].t       
                  }).open();
                if(dimSelect==rdfTriplet.length-1){
                    me.fctClickDim = showDetail
                    toolTipAjoutRapport.close({ignoreDelay: true});
                    toolTipAjoutRapport.detach();
                    let data = {'dcterms:title':'Rapport '};
                    rapportDims.forEach(d => {
                        d.tt.close();
                        d.tt=false;
                        data['dcterms:title'] += d.d['o:title'];
                        data['jdc:has'+d.t] = [{'type':'resource','value':d.d.id}];
                        
                    });
                    data['dcterms:title'] += " : "+Date.now();
                    me.fctCreaDim(null,'Rapport',data);
                }else{
                    toolTipAjoutRapport.setContent('Choisissez un '+rapportDims[dimSelect+1].t);
                    dimSelect++;
                }
            }
        }

        if(me.dataUrl){
            d3.json(me.dataUrl).then(function(graph) {
                me.data = graph;
                me.init();
            });    
        }else{
            me.init();
        }

    }
}

  


