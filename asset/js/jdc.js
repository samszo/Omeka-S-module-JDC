class jdc {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'jdc0';
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.fctClickNode = params.fctClickNode ? params.fctClickNode : console.log;
        this.data = params.data ? params.data : 	{
            "dateCreation": "03/08/2021",
            "auteur": "samszo",
            "title": "JDC exemple",
            "dimensions": {
                "physiques":{"children": [
                    {"id": 1,"title": "vide", "children":[
                        {"id": 11,"title": "vide 11","children":[
                            {"id": 111,"title": "vide 111","value":1}    
                            ,{"id": 112,"title": "vide 112","value":1}    
                            ,{"id": 113,"title": "vide 113","children":[
                                {"id": 1131,"title": "vide 1131","value":1}    
                                ,{"id": 1132,"title": "vide 1132","value":1}    
                            ]}    
                        ]}    
                        ,{"id": 12,"title": "vide 12","children":[
                            {"id": 121,"title": "vide 121","value":1}    
                            ,{"id": 122,"title": "vide 122","value":1}    
                        ]}    
                        ,{"id": 13,"title": "vide 13","value":1}    
                    ]},
                    {"id": 2,"title": "vide 2", "children":[
                            {"id": 21,"title": "vide 21","children":[
                                {"id": 211,"title": "vide 211","value":1}    
                                ,{"id": 212,"title": "vide 212","value":1}    
                            ]}    
                            ,{"id": 22,"title": "vide 22","children":[
                                {"id": 221,"title": "vide 221","value":1}    
                                ,{"id": 222,"title": "vide 222","value":1}    
                            ]}    
                            ,{"id": 23,"title": "vide 23","value":1}    
                    ]},
                    ]},
                "actants": {"children":[
                    {
                    "id": 2,
                    "title": "vide",
                    },
                    {
                    "id": 21,
                    "title": "vide 2",
                    },
                    {
                    "id": 22,
                    "title": "vide 3",
                    },
                    {
                    "id": 23,
                    "title": "vide 4",
                    },
                    {
                    "id": 24,
                    "title": "vide 5",
                    },
                    {
                    "id": 25,
                    "title": "vide 6",
                    },
                ]},
                "concepts": {"children":[
                    {"id": 1,"title": "vide", "value":1, "children":[
                        {"id": 11,"title": "vide 11", "value":1, "children":[
                            {"id": 111,"title": "vide 111","value":1}    
                            ,{"id": 112,"title": "vide 112","value":1}    
                            ,{"id": 113,"title": "vide 113","value":1, "children":[
                                {"id": 1131,"title": "vide 1131","value":1}    
                                ,{"id": 1132,"title": "vide 1132","value":1}    
                            ]}    
                        ]}    
                        ,{"id": 12,"title": "vide 12","value":1, "children":[
                            {"id": 121,"title": "vide 121","value":1}    
                            ,{"id": 122,"title": "vide 122","value":1}    
                        ]}    
                        ,{"id": 13,"title": "vide 13","value":1}    
                    ]},
                    {"id": 2,"title": "vide 2","value":1, "children":[
                        {"id": 21,"title": "vide 21","value":1,"children":[
                            {"id": 211,"title": "vide 211","value":1}    
                            ,{"id": 212,"title": "vide 212","value":1}    
                        ]}    
                        ,{"id": 23,"title": "vide 23","value":1,"value":1}    
                    ]},
                ]},
                "rapports": [
                    //l'ordre est important
                    //le sujet est toujours actant
                    //l'objet est toujours physique
                    //le prédicat est toujours concept
                    {"id": 4,
                    "title": "test",
                    "nodes": [
                        {'rdf':"sujet",'dim':'actants','id':23},
                        {'rdf':"objet",'dim':'physiques','id':1131},
                        {'rdf':"predicat",'dim':'concepts','id':212},
                    ]},
                    {"id": 5,
                    "title": "test 5",
                    "nodes": [
                        {'rdf':"sujet",'dim':'actants','id':22},
                        {'rdf':"objet",'dim':'physiques','id':212},
                        {'rdf':"predicat",'dim':'concepts','id':13},
                    ]},
                ]
            }
        }; 

        var svg, svgBBox, container, dimsBand, hierarchies, physiqueBand;            

        this.init = function () {
            
            //construction des hiérarchies
            hierarchies = {
                "physiques" : d3.hierarchy(me.data.dimensions.physiques)
                ,"actants" : d3.hierarchy(me.data.dimensions.actants)
                ,"concepts" : d3.hierarchy(me.data.dimensions.concepts)
            }
                
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
            //construction des espaces dimensionnels
            let dimsEsp = Object.keys(me.data.dimensions);
            let dimsColor = d3.scaleOrdinal(dimsEsp, d3.schemePastel2);
            dimsBand = d3
                .scaleBand()
                .domain(dimsEsp.slice(0, -1))
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
                    .attr('height',d=>d=='rapports' ? me.height : dimsBand.bandwidth())
                    .attr('x',0)
                    .attr('y',d=>d=='rapports' ? 0 : dimsBand(d))
                    .attr('fill',d=>dimsColor(d))                                         
                    .attr('fill-opacity','0.5');                                         
            dimsG.append('text')
                .attr('id',d=>'dimsText_'+me.id+'_'+d)
                .attr('class','dimsText')
                .attr('x',d=>d=='rapports' ? me.width/2 : 6)
                .attr('y',d=>d=='rapports' ? 12 : dimsBand(d)+dimsBand.bandwidth()/2)
                .text(d=>d);

            //construction des dimensions
            addConcepts();
            addActants();
            addPhysiques();
            addRapports();
        }
        //récupère l'identifiant du root de la hiérarchie   
        function getRootHierarchy(d){
            //récupère le noeud root
            let a = d.ancestors();
            let root = a[a.length-1];
            //renvoie le noeud du treemap   
            return root.data.id;
            }

        function addRapports(){
            //définition des positions des noeuds de contact avec les dimensions
            //physique = autant de bandes que d'actant chaque bandes a autant de bande que de rapport 
            let scalePhy = d3.scaleBand()
            .domain(me.data.dimensions.actants.children.map(d=>d.id))
            .paddingInner(0.5) // edit the inner padding value in [0,1]
            .paddingOuter(0.5) // edit the outer padding value in [0,1]                
            .range([0, physiqueBand.bandwidth()])
            .align(0.5)   
            //construction des datas
            me.data.dimensions.rapports.forEach(r=>{
                //récupère les positions
                let nActant, nActantBas, nPhysiqueBas, nPosi, nbNode = r.nodes.length, marge;
                r.links = [];
                for (let index = 0; index < nbNode; index++) {
                    let n = r.nodes[index];
                    n.path = dimNodePath(n);
                    dimNodePosi(n);
                    switch (n.dim) {
                        case 'actants':
                            nActant = n;
                            //on ajoute un noeud en bas de l'exagone suivant le nombre de lien
                            nActantBas = JSON.parse(JSON.stringify(n));
                            nActantBas.posi.y += dimsBand.bandwidth();
                            r.nodes.push(nActantBas);
                            break;                    
                        case 'physiques':
                            //on ajoute un noeud en bas du rectangle dans la bande qui correspond
                            nPhysiqueBas = JSON.parse(JSON.stringify(n));
                            marge = dimsBand.step()-dimsBand.bandwidth();
                            nPhysiqueBas.posi.y = dimsBand('physiques')+dimsBand.bandwidth()+svgBBox.y;//nPhysiqueBas.posi.y+nPhysiqueBas.posi.height;//+svgBBox.y-marge;
                            nPhysiqueBas.posi.x = physiqueBand(n.dataRoot.id)+scalePhy(nActant.id)+svgBBox.x;
                            r.nodes.push(nPhysiqueBas);
                            r.links.push({'source':nActant.posi, 'target':nPhysiqueBas.posi, 'id':nActant.id+'_'+n.id}); 
                            r.links.push({'source':nPhysiqueBas.posi, 'target':n.posi, 'id':nActant.id+'_'+n.id}); 
                            break;                    
                        case 'concepts':
                            //déplace l'arrivé du lien sur le cercle du noeud                            
                            nPosi = JSON.parse(JSON.stringify(n.posi));
                            nPosi.y -= nPosi.height/2
                            r.links.push({'source':nActantBas.posi, 'target':nPosi, 'id':nActant.id+'_'+n.id}); 
                            break;                    
                        }
                };
            })

                
            let rapportsG = container.selectAll('.jdcRapportG').data(me.data.dimensions.rapports).enter()
                .append('g').attr('id',r=>'jdcRapportG_'+me.id+'_'+r.id).attr('class','jdcRapportG')
                .attr("transform", `translate(${-svgBBox.x},${-svgBBox.y})`);
                
            //draw circles for the links 
            let rapportsNodes = rapportsG.selectAll("circle").data(d=>d.nodes).enter()
                    .append("circle")
                    .attr('id',n=>'jdcRapportN_'+me.id+'_'+n.id)
                    .attr("cx", n=>n.posi.x)
                    .attr("cy", n=>n.posi.y)
                    .attr("r", n=>n.dim=='concepts' ? n.posi.height/2 : 4)
                    .attr("stroke-width", 1)
                    .style("stroke", 'black')
                    .attr("fill", n=>n.dim=='concepts' ? 'none' : 'black')
                    .append("title")
                        .text(n =>{
                            return n.rdf+' - '+n.dim+' = '+n.id+' - '+n.data.title;
                        });  
            //draw lines for the links 
            let rapportsLinks = rapportsG.selectAll("line").data(d=>d.links).enter()
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
                    case 'physiques':
                        path = "#physiqueNode_"+me.id+'_'+n.id;
                        break;                
                    case 'actants':
                        path = '#actantG_'+me.id+'_'+n.id;
                        break;                
                    case 'concepts':
                        path = '#conceptC_'+me.id+'_'+n.id;
                        break;                
                    }
                return path;
            }
            function dimNodePosi(n){
                //retrouve le noeud dans la hiérarchies
                let nf = hierarchies[n.dim].find(d=>d.data.id==n.id);
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
                                case 'actants':
                                    n.posi.x += bbox.width/2;
                                    //n.posi.y += bbox.height/2;            
                                    break;
                                case 'physiques':
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

            let conceptsKey = me.data.dimensions.concepts.children.map(d=>d.id)
            , conceptBand = d3.scaleBand()
                .domain(conceptsKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)
            , conceptsColor = d3.scaleOrdinal(conceptsKey, d3.schemeTableau10)
            , pack = data => d3.pack()
                .size([conceptBand.bandwidth(), dimsBand.bandwidth()])
                //.radius([dimsBand.bandwidth()])
                .padding(3)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value))
            , roots=[], focus=[], views=[], conceptG=[], nodes=[], labels=[], colors=[]
            ;
                                                  
            //ajoute une intériorité globale
            container.append("rect")
                .attr('id','conceptsEllipse_'+me.id)
                .attr('class','conceptsEllipse')
                .attr('x',0)
                .attr('y',dimsBand('concepts')-dimsBand.bandwidth()/2)
                .attr('width',me.width)
                .attr('height',dimsBand.bandwidth()+dimsBand.bandwidth()/2)
                .attr('rx',dimsBand.bandwidth()/2)
                .attr('ry',dimsBand.bandwidth()/2)
                .attr("stroke-width", 2)                
                .attr("stroke", 'black')
                .attr("fill", 'black')
                .attr('fill-opacity','0.3');                      

            me.data.dimensions.concepts.children.forEach(c=>{
                roots[c.id] = pack(c);
                const hsl = d3.hsl(conceptsColor([c.id]));
                colors[c.id] = d3.scaleLinear()
                    .domain([0, 5])
                    .range(["hsl("+hsl.h+",80%,80%)", "hsl("+hsl.h+",30%,40%)"])
                    .interpolate(d3.interpolateHcl)                
                //ajoute le group de concept
                conceptG[c.id] = container.append('g').attr('id','conceptG_'+me.id+'_'+c.id).attr('class','jdcConceptG')

                //simple circle packing
                const format = d3.format(",d")    
                conceptG[c.id].style("font", "10px sans-serif")
                    .attr("text-anchor", "middle")
                    .attr("transform", `translate(${conceptBand(c.id)},${dimsBand('concepts')})`);
                    ;              

                const node = conceptG[c.id]
                    .selectAll('g.jdcConcept')
                    .data(roots[c.id].descendants())
                    .enter()
                    .append("g")
                    .attr('class','jdcConcept')
                    .attr('id','conceptC_'+me.id+'_'+c.id)
                    .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);
                
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
                    .data(d => d.data.title.split(/(?=[A-Z][a-z])|\s+/g))
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
                    .text(d => d);

                node.append("title")
                    .text(d => `${d.ancestors().map(d => d.data.title).reverse().join("/")}\n${format(d.value)}`);
    

            });          

        }

  
        function addPhysiques(){


            physiqueBand = d3.scaleBand()
                .domain(me.data.dimensions.physiques.children.map(d=>d.id))
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5);            
            let x = d3.scaleLinear()
            , y = d3.scaleLinear().rangeRound([dimsBand('physiques')+30, dimsBand.bandwidth()])
            , name = d => d.ancestors().reverse().map(d => d.data.title).join("/")          
            , format = d3.format(",d")
            , treemap           
            , physiquesG=[];
            me.data.dimensions.physiques.children.forEach(p=>{
                physiquesG[p.id]=container.append('g').attr('id','physiquesG_'+me.id+'_'+p.id).attr('class','jdcPhysiqueG');

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
                const colorPhy = d3.scaleOrdinal(d3.schemeCategory10)
                
                physiquesG[p.id]
                    .style("font", "10px sans-serif")
                    .attr("transform", `translate(${physiqueBand(p.id)},${dimsBand('physiques')})`);
              
                const node = physiquesG[p.id].selectAll("g")
                  .data(d => root.descendants())
                  .join("g")
                    .attr("id", d => "physiqueNode_"+me.id+'_'+d.data.id)
                    .attr("transform", d => `translate(${d.x0},${d.y0})`);                        

                node.append("title")
                    .text(d => `${d.ancestors().reverse().map(d => d.data.title).join("/")}\n${format(d.value)}`);
              
                node.append("rect")
                    .attr("id", d => d.nodeUid = "physiqueRect_"+me.id+'_'+d.data.id)
                    .attr("fill", d => colorPhy(d.depth))
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0);
              
                node.append("clipPath")
                    .attr("id", d => d.clipUid = "physiqueClip_"+me.id+'_'+d.data.id)
                  .append("use")
                    .attr("xlink:href", d => "#"+d.nodeUid);
              
                node.append("text")
                    .attr("clip-path", d => d.clipUid)
                  .selectAll("tspan")
                  .data(d => d.data.title.split(/(?=[A-Z][^A-Z])/g))
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

            //récupère les clefs des actants
            let actantsKey = me.data.dimensions.actants.children.map(d => d.id);
            //attribution des couleurs
            let actantsColor = d3.scaleOrdinal(actantsKey, d3.schemeCategory10);
            me.data.dimensions.actants.children.forEach(d=>d.color = d.color ? d.color : actantsColor(d.id))

            let actantBand = d3.scaleBand()
                .domain(actantsKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)            
            , actantG = container.selectAll('.jdcActant').data(me.data.dimensions.actants.children).enter()
                    .append('g').attr('id',d=>'actantG_'+me.id+'_'+d.id).attr('class','actantG')
            , hexbin = d3.hexbin()
                .radius(dimsBand.bandwidth()/2);
            /*ajoute les intériorités
            actantG.append("ellipse")
                .attr('id',d=>'actantsEllipse_'+me.id+'_'+d.id)
                .attr('class','actantsEllipse')
                .attr('cx',d=>actantBand(d.id))
                .attr('cy',dimsBand('concepts')+dimsBand.bandwidth()/4)
                .attr('rx',d=>actantBand.bandwidth())
                .attr('ry',dimsBand.bandwidth()/1.5)
                .attr("stroke-width", 2)                
                .attr("stroke", d=>d.color)
                .attr("fill", d=>d.color)
                .attr('fill-opacity','0.3');
            */                                         
            //ajoute les hexagones
            actantG.append("path")
                .attr('id',d=>'actantsPath_'+me.id+'_'+d.id)
                .attr('class','actantsPath')
                .attr("d", hexbin.hexagon())
                .attr("transform", d => `translate(${actantBand(d.id)+actantBand.bandwidth()/2},${dimsBand('actants')+dimsBand.bandwidth()/2})`)
                .attr("fill", d=>d.color);
            //ajoute les titres
            actantG.append("text")
                .attr('id',d=>'actantsText_'+me.id+'_'+d.id)
                .attr('class','actantsText')
                .attr('x',d=>actantBand(d.id)+actantBand.bandwidth()/2)
                .attr('y',dimsBand('actants')+dimsBand.bandwidth()/2)
                .attr('text-anchor','middle')
                .text(d=>d.title);


        }

        this.hide = function(){
          svg.attr('visibility',"hidden");
        }
        this.show = function(){
          svg.attr('visibility',"visible");
        }

        function fctExecute(p) {
            switch (p.data.fct) {
                case 'addDimension':
                    console.log(p);
                    break;
                default:
                  console.log(p);
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

  


