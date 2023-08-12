//many thanks to https://observablehq.com/@d3/treemap/2?intent=fork
export class jdcPhysiques {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'jdcP';
        this.items = params.items ? params.items : false;
        this.idRoot = params.idRoot ? params.idRoot : false;
        this.cont = params.cont ? params.cont : d3.select('body');
        this.aUrl = params.aUrl ? params.aUrl : false;
        // Specify the chart’s dimensions.
        const width = params.width ? params.width : 1024;
        const height = params.height ? params.height : 600;
        // Create the scales.
        const x = d3.scaleLinear().rangeRound([0, width]);
        const y = d3.scaleLinear().rangeRound([0, height]);        
        // Formatting utilities.
        const format = d3.format(",d");
        const name = d => d.ancestors().reverse().map(d => d.data['o:title']).join(" / ");

        let root, svg, group;

        this.init = function () {
            root = d3.stratify()
                .id((d) => d['o:id'])
                .parentId((d) => d["dcterms:isPartOf"] ? d["dcterms:isPartOf"][0].value_resource_id : "")
                (me.items.filter(d=>{
                    d.duree = getDuree(d);
                    d.value = d.duree == 1 ? 1 : d.duree.total_days;
                    return d["dcterms:isPartOf"] || d['o:id']==me.idRoot
                }));
            console.log(root);
            setGraph(root)
        }

        function getDuree(d,j=0){
          let duree = 0, deb, fin;
          if(j){
            deb = new Date();
            fin = new Date();
            fin.setDate(fin.getDate() + j);
            duree = calcDate(fin, deb);
          }else{
            if(d["schema:startDate"] && d["schema:endDate"]){
              if(d["schema:endDate"][0]["@value"]=='now')fin=Date.now();
              else fin = Date.parse(d["schema:endDate"][0]["@value"]);
              deb = Date.parse(d["schema:startDate"][0]["@value"]);
              duree = calcDate(fin, deb);
            }else duree = 1;  
          }
          return duree
        }

        function calcDate(date1, date2){
          /*
          * calcDate() : Calculates the difference between two dates
          * @date1 : "First Date in the format MM-DD-YYYY"
          * @date2 : "Second Date in the format MM-DD-YYYY"
          * return : Array
          */
          //new date instance
          const dt_date1 = new Date(date1);
          const dt_date2 = new Date(date2);
      
          //Get the Timestamp
          const date1_time_stamp = dt_date1.getTime();
          const date2_time_stamp = dt_date2.getTime();
      
          let calc;
      
          //Check which timestamp is greater
          if (date1_time_stamp > date2_time_stamp) {
              calc = new Date(date1_time_stamp - date2_time_stamp);
          } else {
              calc = new Date(date2_time_stamp - date1_time_stamp);
          }
          //Retrieve the date, month and year
          const calcFormatTmp = calc.getDate() + '-' + (calc.getMonth() + 1) + '-' + calc.getFullYear();
          //Convert to an array and store
          const calcFormat = calcFormatTmp.split("-");
          //Subtract each member of our array from the default date
          const days_passed = Number(Math.abs(calcFormat[0]) - 1);
          const months_passed = Number(Math.abs(calcFormat[1]) - 1);
          const years_passed = Number(Math.abs(calcFormat[2]) - 1970);
      
          //Set up custom text
          const yrsTxt = ["année", "années"];
          const mnthsTxt = ["mois", "mois"];
          const daysTxt = ["jour", "jours"];
      
          //Convert to days and sum together
          const total_days = (years_passed * 365) + (months_passed * 30.417) + days_passed;
      
          //display result with custom text
          const result = ((years_passed == 1) ? years_passed + ' ' + yrsTxt[0] + ' ' : (years_passed > 1) ?
              years_passed + ' ' + yrsTxt[1] + ' ' : '') +
              ((months_passed == 1) ? months_passed + ' ' + mnthsTxt[0] : (months_passed > 1) ?
                  months_passed + ' ' + mnthsTxt[1] + ' ' : '') +
              ((days_passed == 1) ? days_passed + ' ' + daysTxt[0] : (days_passed > 1) ?
                  days_passed + ' ' + daysTxt[1] : '');
      
          //return the result
          return {
              "total_days": Math.round(total_days),
              "result": result.trim()
          }
      }

        // This custom tiling function adapts the built-in binary tiling function
        // for the appropriate aspect ratio when the treemap is zoomed-in.
        function tile(node, x0, y0, x1, y1) {
            d3.treemapBinary(node, 0, 0, width, height);
            for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
            }
        }

        function setGraph(data){

            // Specify the color scale.
            const color = d3.scaleOrdinal(data.children.map(d => {
                return d.data["o:title"];
            }), d3.schemeTableau10);

            // Compute the layout.
            const root = d3.treemap()
            .tile(tile) // e.g., d3.treemapSquarify
            (data
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value));

            // Create the SVG container.
            svg = me.cont.append("svg")
                .attr("viewBox", [0.5, -30.5, width, height + 30])
                .attr("width", width)
                .attr("height", height + 30)
                .attr("style", "max-width: 100%; height: auto;")
                .style("font", "10px sans-serif");
      
            // Display the root.
            group = svg.append("g").attr('class',"gBlock")
                .call(render, root);

            if(me.aUrl.params && me.aUrl.params.has('event')){              
              let idEvent= me.aUrl.params.get('event'),
                event = root.find(n=>n.data['o:id']==idEvent);
              zoomin(event);
            }

                 
        }


        function render(group, root) {
            const node = group
              .selectAll(".gBlock")
              .data(root.children.concat(root))
              .join("g");
            node.attr('class',"gBlock");
            node.filter(d => d === root ? d.parent : d.children)
                .attr("cursor", d => d === root ? "zoom-out" : "zoom-in")
                .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));
        
            node.append("title")
                .text(d => `${name(d)}\n${format(d.value)}`);
        
            node.append("rect")
                .attr("id", d => (d.leafUid = "physiqueRect"+me.id+d.data['o:id']))
                .attr("fill", d => d === root ? "#fff" : d.children ? "#ccc" : "#ddd")
                .attr("stroke", "#fff");
        
            node.append("clipPath")
                .attr("id", d => (d.clipUid = "physiqueClip"+me.id+d.data['o:id']))
                .append("use")
                .attr("xlink:href", d => '#'+d.leafUid);
        
            node.append("text")
                .attr("clip-path", d => d.clipUid)
                .attr("font-weight", d => d === root ? "bold" : null)
              .selectAll("tspan")
              //.data(d => (d === root ? name(d) : d.data['o:title']).split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
              .data(d => {
                let dt = (d === root ? name(d) : d.data['o:title']).split('*').concat(d.data.duree == 1 ? getDuree(0,d.value).result : d.data.duree.result);
                return dt;
              })
              .join("tspan")
                .attr("x", 20)
                //.attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
                .attr("y", (d, i, nodes) => `${0.3 + 1.1 + i}em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
                .text(d => d);        
            //ajoute un lien vers le détail de l'item
            let detail = node.append('g').attr('transform','translate(10,10)')
              .attr("cursor", "pointer")
              .on('click',openDetail);
            detail.append('circle').attr('r',6).attr('stroke','red').attr('fill','white');
            detail.append('text').attr('x',-1).attr('y',3).text('i');
            
            
            group.call(position, root);
          }
        
          function openDetail(e,d){
            let url = d.data["@id"].replace('api/items','admin/item');
            window.open(url, "_blank");
          }
          function position(group, root) {
            group.selectAll(".gBlock")
                .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
              .select("rect")
                .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
                .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
          }
        
          // When zooming in, draw the new nodes on top, and fade them in.
          function zoomin(d) {
            if(me.aUrl)me.aUrl.change('event',d.data['o:id']);
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.append("g").attr('class',"gBlock").call(render, d);
        
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
            if(me.aUrl)me.aUrl.change('event',d.data['o:id']);
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.insert("g", "*").attr('class',"gBlock").call(render, d.parent);
        
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
        
        this.init();    
    }
}