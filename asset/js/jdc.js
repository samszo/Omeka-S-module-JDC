class reseau {
    constructor(params) {
        var me = this;
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.fctClickNode = params.fctClickNode ? params.fctClickNode : console.log;
        this.data = params.data ? params.data : 	{
            "nodes": [
                {
                "id": "Myriel",
                "group": 1
                },
                {
                "id": "Napoleon",
                "group": 1
                },
            ],
            "links": [
                {
                "source": "Napoleon",
                "target": "Myriel",
                "value": 1
                },
                {
                "source": "Mlle.Baptistine",
                "target": "Myriel",
                "value": 8
                },
            ]
        }; 

        var svg, container;            

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

  


