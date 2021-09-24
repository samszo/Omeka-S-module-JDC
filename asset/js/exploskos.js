/*!
  * exploskos v0.0.1 
  * Copyright 2020 Samuel Szoniecky
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
 class exploskos {
    constructor(params) {
        var me = this;
        this.cont = d3.select("#"+params.idCont);
        this.margin = params.margin ? params.margin : {top: 10, right: 10, bottom: 10, left: 0},            
        this.data = params.data ? params.data : [];
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.urlDetails = params.urlDetails ? params.urlDetails : "../item/";        
        this.dataType = params.dataType ? params.dataType : 'json';
        this.width = params.width ? params.width : 0,
        this.height = params.height ? params.height : 0,
        this.colorFond = params.colorFond ? params.colorFond : "transparent";
        this.fctCallBackInit = params.fctCallBackInit ? params.fctCallBackInit : false;
        this.fctAjoutSkos = params.fctAjoutSkos ? params.fctAjoutSkos : false;
        this.idItem = params.idItem ? params.idItem : false;
        this.fontSize = params.fontSize ? params.fontSize : 14;
        this.noeudBase;
        this.fctUpdateDim = params.fctUpdateDim ? params.fctUpdateDim : console.log;
        this.fctClickLegende = params.fctClickLegende ? params.fctClickLegende : console.log;
        this.settingsColors = params.settingsColors ? params.settingsColors : [];

        var svg, container, color, colorSkos, tooltip, graph, edgeColor = "path", legende, lgdSize;            


        this.init = function () {
        
            let nodeCont = this.cont.node();
            if(!me.width)
                me.width = nodeCont.clientWidth - me.margin.left - me.margin.right;
            if(!me.height)
                me.height = window.innerHeight - nodeCont.offsetTop - me.margin.top - me.margin.bottom;
            lgdSize = {x: 0, y:0, width: me.width, height: me.fontSize*2};

            //gestion des couleurs
            color = d3.scaleSequential().domain([me.width, 0]).interpolator(d3['interpolateInferno']),
            colorSkos = d3.scaleOrdinal(d3.schemeCategory10);
            //récupère les couleurs des settings
            me.settingsColors.forEach(c => colors[c.class]=c.color);                

            this.cont.select("svg").remove();
            svg = this.cont.append("svg")
                .attr("width", me.width+'px')
                .attr("height", me.height+'px')
            //ajout d'un rectangle car Chrome gère le background au dessus des dégradé
            .style("background-color","black");         
            /*
            svg.append('rect')
                .attr("x", 0)
                .attr("y", lgdSize.height)
                .attr("fill", 'white')
                .attr("width", me.width)
                .attr("height", me.height - lgdSize.height)
            */            
            
            //ajoute la légende
            legende = svg.append('g').attr('id','exploskosLegende')

            //création du conteneur de sankey
            container = svg.append("g");
            
            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );


            graph = d3.sankey()
                .nodeSort(null)
                .linkSort(null)
                .nodeWidth(10)
                .nodePadding(20)
                //.extent([[0, 5], [me.width, me.height - 5]]);
                .extent([[0, lgdSize.height*1.5], [me.width, me.height - lgdSize.height]]);
  
            me.draw(false);

          //ajout du tooltip
          d3.select(".tooltipExploskos").remove();
          tooltip = d3.select("body").append("div")
            .attr("class", "tooltipExploskos")
            .style('position','absolute')
            .style('padding','4px')
            .style('background-color','black')
            .style('color','white')
            .style('pointer-events','none');
                
        }

        this.hide = function(){
          svg.attr('visibility',"hidden");
        }
        this.show = function(){
          svg.attr('visibility',"visible");
        }
        this.draw = function(data){
            if(data)me.data=data;
            const {nodes, links} = graph({
                nodes: me.data.nodes,
                links: me.data.links
              });
            me.noeudBase = nodes[2];

            //initialise le graph
            container.selectAll("g").remove();
            legende.selectAll("g").remove();

            const link = container.append("g")
                .attr("stroke-opacity", 0.5)
              .selectAll("g")
              .data(links)
              .join("g");
              //  .style("mix-blend-mode", "multiply");
                    
            //ajout dégradé
            const gradient = link.append("linearGradient")
              .attr("id", d => (
                d.uid = "gdtLink"+d.index
                ))
              .attr("gradientUnits", "userSpaceOnUse")
              .attr("x1", d => d.source.x1)
              .attr("x2", d => d.target.x0);          
            
            gradient.append("stop")
              .attr("offset", "0%")
              .attr("stop-color", d => 
                d.source.type == 'deb' ? color(d.source.x0) : colorSkos(d.source.type)
              );

            gradient.append("stop")
              .attr("offset", "25%")
              .attr("stop-color", d => 
                d.source.type == 'deb' ? color(d.source.x0)
                : d.target.type == 'fin'  ? color(d.target.x0)
                : colorSkos(d.r.term)
              );

            gradient.append("stop")
              .attr("offset", "75%")
              .attr("stop-color", d => 
              d.source.type == 'deb' ? color(d.source.x0)
                : d.target.type == 'fin'  ? color(d.target.x0)
                : colorSkos(d.r.term)
            );
              
            gradient.append("stop")
              .attr("offset", "100%")
              .attr("stop-color", d => 
                d.target.type == 'fin' ? color(d.target.x0) : colorSkos(d.target.type)
              );
                
            link.append("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", d => 
                    edgeColor === "none" ? "#aaa"
                    : edgeColor === "path" ? "url(#"+d.uid+")" 
                    : edgeColor === "input" ? color(d.source.x0) 
                    : color(d.target.x0))
                .attr("stroke-width", 
                  d => Math.max(1, d.width)
                  );
          
            link.append("title")
              .text(d => `${d.source.name} → ${d.target.name}`);

            //ajoute le noeud
            container.append("g")
              .selectAll("rect")
              .data(nodes)
              .join("rect")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("fill", d => d.type=='deb' || d.type=='fin' ? color(d.x0) : colorSkos(d.type))
                .attr("height", d => d.y1 - d.y0)
                .attr("width", d => d.x1 - d.x0)
              .append("title")
                .text(d => {
                  let n = d.type=='deb' || d.type=='fin' ? d.name : "";
                  if(!n) d.sourceLinks.forEach(
                    l => n+= l.names.join(' -> ')+'\n')                    
                  return n;
                });
              
            //ajoute le texte
            var txts = container.append("g")
              .attr("font-family", "sans-serif")
              .selectAll("text")
              .data(nodes)
              .join("text")
                .attr("x", d => d.x0 < me.width / 2 ? d.x1 + 6 : d.x0 - 6)
                .attr("y", d => (d.y1 + d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.x0 < me.width / 2 ? "start" : "end")
                .attr("font-size", d => d.type == "concept" ? me.fontSize*2 : me.fontSize)
                .style("fill", d => d.type == "concept" ? "white" : "white")
                .style("cursor",d => d.type=='deb' || d.type=='fin' ? "none" : "zoom-in")
                .text(d => d.name)
                .on('click',(e,d) => {
                  d.type=='deb' || d.type=='fin' ?
                    console.log(d) : me.showDetail(e,d);
                });
            /*
            txts.append("tspan")
                .attr("fill-opacity", 0.7)
                .text(d => 
                  `${d.value.toLocaleString()}`);
            */

            /*ajoute les boutons d'actions
            var icons = svg.selectAll(".iconButton")
              .data(nodes)
              .join("g")
                .attr('class','iconButton')
                //.attr("x", d => d.x0 < me.width / 2 ? d.x1 + 6 : d.x0 - 6)
                //.attr("y", d => (d.y1 + d.y0) / 2)
                .attr("transform",d => "translate("
                    +(d.x0 < me.width / 2 ? d.x1 + 6 : d.x0 - 50)
                    +" "+ (10 + (d.y1 + d.y0) / 2)+ ") scale(0.05)")
                .html('<i class="fas fa-search-plus"></i>')
                .on("click",me.fctAjoutSkos);
            */

            //ajoute la légende
            let typeNoeud = Array.from(d3.group(nodes.filter(d=> d.type!='deb' && d.type!='fin'), d => d.type).keys());
            addLegende('noeuds', typeNoeud,{y:0});
            let typeLiens = Array.from(d3.group(links.filter(d=> d.r.term!='deb' && d.r.term!='fin'), d => d.r.term).keys());
            addLegende('liens', typeLiens,{y:lgdSize.height/2});

          }

        function addLegende(nom, types,ori){

            types.unshift(nom+' : ');              
            let scaleLgdHori = d3
              .scaleBand()
              //.paddingInner(0.2)
              .domain(types)
              .range([lgdSize.x, lgdSize.width]);            
            let itemsLgd = legende.selectAll('.ilgd'+nom).data(types).enter()
                .append('g').attr('class','ilgd'+nom)
                .style("cursor","pointer")
                .on('click',me.fctClickLegende);
            itemsLgd.append('rect')         
              .attr("x", d => scaleLgdHori(d))
              .attr("y", ori.y+lgdSize.height/4)
              .attr("fill", (d,i) => i==0 ? 'black' : colorSkos(d))
              .attr("height", lgdSize.height/2)
              .attr("width", scaleLgdHori.bandwidth());
            itemsLgd.append('text')         
              .attr("x", (d,i) => i==0 ? scaleLgdHori(d) : scaleLgdHori(d)+scaleLgdHori.bandwidth()/2)
              .attr("y", ori.y+lgdSize.height/2 + me.fontSize/2)
              .attr("text-anchor", (d,i) => i==0 ? "start" : "middle")
              .attr("font-size", me.fontSize)
              .style("fill", "white")
              .text(d => d);
        }

        function getColor(key){
          let c = "#aaa";            
          if(key){
              c = colors[key] ? colors[key] : color(key); 
          }
          return c;
      }
      
        function getTooltip(d){
            //calcule les élément du tooltip
            //if(totalTemps[dt.temps]==0)totalTemps[dt.temps] = 0.1;			
            var s = me.data.sujets[d.keys[0]];	    	
            var o = me.data.objets[d.keys[1]];	    	
            var p = me.data.predicats[d.keys[2]];	    	
            tooltip.html("<h3>Sujet : "+s.name+"</h3>"
                +"<h3>Objet : "+o.name+"</h3>"
                +"<h3>Predicat : "+p.name+"</h3>"
                )
                .style("left", (d3.event.pageX + 12) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
	    }

      this.showDetail = function(e,d){
        if(!d.modal){
            let t = e.currentTarget.id ? e.currentTarget.id : 'exploskosLegende';
            //merci à https://stephanwagner.me/jBox/documentation
            d.modal = new jBox('Modal', {
                title: '---',
                overlay: false,
                draggable: 'title',
                repositionOnOpen: true,
                repositionOnContent: true,
                target: '#'+t,
                position: {
                    x: 'left',
                    y: 'top'
                },
                title:d.item['o:title'],
                content:getModalContent(d.item),
                onCloseComplete:function(){
                    //met à jour les infos
                    me.fctUpdateDim(d.item);
                }
            })
        }
        d.modal.open();            
      }

      function getModalContent(d){
        return `<iframe 
        width="600"
        height="600"
        src="${user ? d.adminUrl : d.siteUrl}"></iframe>`;//ATTENTION user définie dans le thème JDC
      }


        if(me.dataUrl){
            if(me.dataType=='json'){
                d3.json(me.dataUrl).then(function(data) {
                    me.data = data;
                    me.init();
                });        
            }
            if(me.dataType=='csv'){
                d3.csv(me.dataUrl).then(function(data) {
                    //TODO:formatage des données csv
                    me.data = data;
                    me.init();
                });
                
            }
        }else{
            me.init();
        }


    }
}

  

