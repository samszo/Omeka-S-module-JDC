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
                "physiques": [
                    {
                    "id": 1,"title": "vide", "children":[
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
                    ]
                    },
                    {
                        "id": 2,"title": "vide 2", "children":[
                            {"id": 21,"title": "vide 21","children":[
                                {"id": 211,"title": "vide 211","value":1}    
                                ,{"id": 212,"title": "vide 212","value":1}    
                            ]}    
                            ,{"id": 22,"title": "vide 22","children":[
                                {"id": 221,"title": "vide 221","value":1}    
                                ,{"id": 222,"title": "vide 222","value":1}    
                            ]}    
                            ,{"id": 23,"title": "vide 23","value":1}    
                        ]
                    },
                    ],
                "actants": [
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
                ],
                "concepts": [
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
                ],
                "rapports": [
                    {
                    "id": 4,
                    "title": "vide",
                    "sujet": 2,
                    "objet": 1,
                    "predicat": 3,
                    },
                ]
            }
        }; 

        var svg, container,dimsY;            

        this.init = function () {
            
                
            svg = this.cont.append("svg").attr("width", me.width+'px').attr("height", me.height+'px');

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
            let dimsEsp = ["physiques","actants","concepts"];
            let dimsColor = d3.scaleOrdinal(dimsEsp, d3.schemePastel2);
            dimsY = d3
                .scaleBand()
                .domain(dimsEsp)
                .paddingInner(0) // edit the inner padding value in [0,1]
                .paddingOuter(0.2) // edit the outer padding value in [0,1]                
                .range([0, me.height]);            
            let dimsG = container.selectAll('.jdcDim').data(dimsEsp).enter()
                .append('g').attr('id',d=>'dimsG_'+me.id+'_'+d).attr('class','dimsG');
            dimsG.append('rect')
                    .attr('id',d=>'dimsRect_'+me.id+'_'+d)
                    .attr('class','dimsRect')
                    .attr('width',me.width)
                    .attr('height',dimsY.bandwidth())
                    .attr('x',0)
                    .attr('y',d=>dimsY(d))
                    .attr('fill',d=>dimsColor(d))                                         
                    .attr('fill-opacity','0.3');                                         
            dimsG.append('text')
                .attr('id',d=>'dimsText_'+me.id+'_'+d)
                .attr('class','dimsText')
                .attr('x',6)
                .attr('y',d=>dimsY(d)+dimsY.bandwidth()/2)
                .text(d=>d);

            //construction des dimensions
            addConcepts();
            addActants();
            addPhysiques();
        }


        function addConcepts(){

            let view
            , conceptBand = d3.scaleBand()
                .domain(me.data.dimensions.concepts.map(d=>d.id))
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)            
            , color = d3.scaleLinear()
                .domain([0, 5])
                .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
                .interpolate(d3.interpolateHcl)
            , oConcept = me.data.dimensions.concepts[0]
            , pack = data => d3.pack()
                .size([conceptBand(oConcept.id), dimsY.bandwidth()])
                //.radius([dimsY.bandwidth()])
                .padding(3)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value))
            , root = pack(oConcept)
            , focus = root;
                                                  
            const conceptG = container.append('g').attr('id','conceptG_'+me.id).attr('class','jdcConceptG')
                .style("cursor", "pointer")
                .attr("transform", `translate(${conceptBand(oConcept.id)},${dimsY('concepts')+dimsY.bandwidth()/2})`)
                .on("click", (event) => zoom(event, root));
            //ajoute une ellipse globale
            conceptG.append("ellipse")
                .attr('id','conceptsEllipse_'+me.id+'_'+oConcept.id)
                .attr('class','conceptsEllipse')
                .attr('cx',conceptBand.bandwidth()/2)
                .attr('cy',-dimsY.bandwidth()/4)
                .attr('rx',me.width/2)
                .attr('ry',dimsY.bandwidth()*0.8)
                .attr("stroke-width", 2)                
                .attr("stroke", color(0))
                .attr("fill", color(0))
                .attr('fill-opacity','0.3');                                         

            //ajoute les cercles de concepts    
            const node = conceptG.append("g")
              .selectAll("circle")
              .data(root.descendants().slice(1))
              .join("circle")
                .attr("fill", d => d.children ? color(d.depth) : "white")
                .attr("pointer-events", d => !d.children ? "none" : null)
                .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
                .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));
          
            const label = conceptG.append("g")
                .style("font", "10px sans-serif")
                .attr("pointer-events", "none")
                .attr("text-anchor", "middle")
              .selectAll("text")
              .data(root.descendants())
              .join("text")
                .style("fill-opacity", d => d.parent === root ? 1 : 0)
                .style("display", d => d.parent === root ? "inline" : "none")
                .text(d => d.data.title);
          
            zoomTo([root.x, root.y, root.r * 2]);
          
            function zoomTo(v) {
              const k = dimsY.bandwidth() / v[2];
              //let  yK = dimsY('concepts'); 
          
              view = v;
          
              label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
              node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
              node.attr("r", d => d.r * k);
            }
          
            function zoom(event, d) {
              const focus0 = focus;
          
              focus = d;
          
              const transition = conceptG.transition()
                  .duration(event.altKey ? 7500 : 750)
                  .tween("zoom", d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                  });
          
              label
                .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                .transition(transition)
                  .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                  .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                  .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
            }
          

        }


        function addPhysiques(){


            let physiqueBand = d3.scaleBand()
                .domain(me.data.dimensions.physiques.map(d=>d.id))
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)            
            , x, y = d3.scaleLinear().rangeRound([dimsY('physiques')+30, dimsY.bandwidth()])
            , name = d => d.ancestors().reverse().map(d => d.data.title).join("/")          
            , format = d3.format(",d")
            , treemap = data => d3.treemap()
                    .tile(tile)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value))            
            //, group = container.append('g').attr('id','physiquesG_'+me.id).attr('class','jdcPhysiqueG')
            //    .call(render, treemap(me.data.dimensions.physiques[0]))
            , physiquesG=[];
            me.data.dimensions.physiques.forEach(p=>{
                physiquesG[p.id]=container.append('g').attr('id','physiquesG_'+me.id).attr('class','jdcPhysiqueG')
                    .call(render, treemap(p));
            })    
            /*
            , group, physiquesG = container.selectAll('.jdcPhysique').data(me.data.dimensions.physiques).enter()
                .append('g').attr('id',d=>'physiquesG_'+me.id+'_'+d.id).attr('class','jdcPhysiqueG')
                .each(function(d) { render(null, treemap(d)); });
   
            function render(n, root) {
              group = n ? n : getPhysiqueGroup(root);  
                //const group = n ? d3.select(n) : g;
            */
            function render(group, root) {
                const node = group
                    .selectAll("g")
                    .data(root.children.concat(root))
                    .join("g");
          
              node.filter(d => d === root ? d.parent : d.children)
                  .attr("cursor", "pointer")
                  .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));
          
              node.append("title")
                  .text(d =>{
                      return `${name(d)}\n${format(d.value)}`;
                  }) 
          
              node.append("rect")
                  .attr("id", d => d.leafUid = "leaf"+d.data.id)
                  .attr("fill", d => d === root ? "#fff" : d.children ? "#ccc" : "#ddd")
                  .attr("stroke", "#fff");
          
              node.append("clipPath")
                  .attr("id", d => d.clipUid = "clip"+d.data.id)
                .append("use")
                  .attr("xlink:href", d => d.leafUid.href);
          
              node.append("text")
                  .attr("clip-path", d => d.clipUid)
                  .attr("font-weight", d => d === root ? "bold" : null)
                .selectAll("tspan")
                //.data(d => (d === root ? name(d) : d.data.title).split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
                .data(d => (d === root ? name(d) : d.data.title).split(/(?=[A-Z][^A-Z])/g))
                .join("tspan")
                  .attr("x", 3)
                  .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
                  .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                  .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
                  .text(d => d);
          
              group.call(position, root);
            }
          
            function position(group, root) {
                let idGroup = getPhysiqueGroup(root);  
                let xRoot = physiqueBand(idGroup);
                x = d3.scaleLinear().rangeRound([xRoot, xRoot+physiqueBand.bandwidth()]);
                group.selectAll("g")
                  .attr("transform", d => d === root ? `translate(${xRoot},${dimsY('physiques')})` : `translate(${x(d.x0)},${y(d.y0)})`)
                .select("rect")
                  .attr("width", d => {
                      return d === root ? physiqueBand.bandwidth() : x(d.x1) - x(d.x0)
                  })
                  .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
            }
          
            //récupère le g root du treemap   
            function getPhysiqueGroup(d){
              //récupère le noeud root
              let a = d.ancestors();
              let root = a[a.length-1];
              //renvoie le noeud du treemap   
              return root.data.id;
            }
  
            // When zooming in, draw the new nodes on top, and fade them in.
            function zoomin(d) {
              let idGroup = getPhysiqueGroup(d);  
              const group0 = physiquesG[idGroup].attr("pointer-events", "none");
              const group1 = physiquesG[idGroup] = container.append("g").call(render, d);
          
              x.domain([d.x0, d.x1]);
              y.domain([d.y0, d.y1]);
          
              svg.transition()
                  .duration(750)
                  .call(t => group0.transition(t).remove()
                    .call(position, d.parent))
                  .call(t => group1.transition(t)
                    .attrTween("opacity", () => d3.interpolate(0, 1))
                    .call(position, d));
            }
          
            // When zooming out, draw the old nodes on top, and fade them out.
            function zoomout(d) {
                let idGroup = getPhysiqueGroup(d);  
                const group0 = physiquesG[idGroup].attr("pointer-events", "none");
                const group1 = physiquesG[idGroup] = container.append("g").call(render, d.parent);
          
              x.domain([d.parent.x0, d.parent.x1]);
              y.domain([d.parent.y0, d.parent.y1]);
          
              svg.transition()
                  .duration(750)
                  .call(t => group0.transition(t).remove()
                    .attrTween("opacity", () => d3.interpolate(1, 0))
                    .call(position, d))
                  .call(t => group1.transition(t)
                    .call(position, d.parent));
            }

            /*
            This custom tiling function adapts the built-in binary tiling function 
            for the appropriate aspect ratio when the treemap is zoomed-in.
            */
            function tile(node, x0, y0, x1, y1) {
                d3.treemapBinary(node, 0, 0, physiqueBand.bandwidth(), dimsY.bandwidth());
                for (const child of node.children) {
                child.x0 = x0 + child.x0 / physiqueBand.bandwidth() * (x1 - x0);
                child.x1 = x0 + child.x1 / physiqueBand.bandwidth() * (x1 - x0);
                child.y0 = y0 + child.y0 / dimsY.bandwidth() * (y1 - y0);
                child.y1 = y0 + child.y1 / dimsY.bandwidth() * (y1 - y0);
                }
            }          

        }


        function addActants(){

            //récupère les clefs des actants
            let actantsKey = me.data.dimensions.actants.map(d => d.id);
            //attribution des couleurs
            let actantsColor = d3.scaleOrdinal(actantsKey, d3.schemeCategory10);
            me.data.dimensions.actants.forEach(d=>d.color = d.color ? d.color : actantsColor(d.id))

            let actantBand = d3.scaleBand()
                .domain(actantsKey)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(1)            
            , actantG = container.selectAll('.jdcActant').data(me.data.dimensions.actants).enter()
                    .append('g').attr('id',d=>'actantG_'+me.id+'_'+d.id).attr('class','actantG')
            , hexbin = d3.hexbin()
                .radius(dimsY.bandwidth()/2);
            /*ajoute les intériorités
            actantG.append("ellipse")
                .attr('id',d=>'actantsEllipse_'+me.id+'_'+d.id)
                .attr('class','actantsEllipse')
                .attr('cx',d=>actantBand(d.id))
                .attr('cy',dimsY('concepts')+dimsY.bandwidth()/4)
                .attr('rx',d=>actantBand.bandwidth())
                .attr('ry',dimsY.bandwidth()/1.5)
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
                .attr("transform", d => `translate(${actantBand(d.id)},${dimsY('actants')+dimsY.bandwidth()/2})`)
                .attr("fill", d=>d.color);
            //ajoute les titres
            actantG.append("text")
                .attr('id',d=>'actantsText_'+me.id+'_'+d.id)
                .attr('class','actantsText')
                .attr('x',d=>actantBand(d.id))
                .attr('y',dimsY('actants')+dimsY.bandwidth()/2)
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

  


