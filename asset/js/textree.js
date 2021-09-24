"use strict";
class textree {
    constructor(params) {
        var me = this;
        this.text = params.text ? params.text : false;
        this.data = params.data ? params.data : false;
        this.dataTxt = false;
        this.parseCaract = params.parseCaract ? params.parseCaract : false;
        this.langage = params.langage ? params.langage : 'texte';
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 18;
        this.currentFct = params.currentFct ? params.currentFct : console.log;
        this.clickAssoFct = params.clickAssoFct ? params.clickAssoFct : console.log;
        this.currentAsso = []
        var svg, w, h, color, colorLink, nbNiv = 4, invNiv, hierarchie, divTexte, opacity=1;

        this.init = function () {


            //analyse du texte            
            me.analyseText();

            //calcul la hiérarchie
            hierarchie = d3.hierarchy(me.dataTxt);

            color = d3.scaleOrdinal().range(d3.quantize(d3.interpolateMagma, nbNiv));
            invNiv = d3.scaleLinear().range([0,nbNiv]).domain([nbNiv,0]);
            color = d3.scaleOrdinal([0,nbNiv], d3.schemePastel2);
            colorLink = d3.scaleSequential()
                .domain([0,me.data['dcterms:hasPart'] ? me.data['dcterms:hasPart'].length : 1])
                .interpolator(d3['interpolatePlasma']);

            creaText();           
            creaAsso();           
        };

        this.updateAsso=function(dt){
            me.data = dt;
            creaAsso();
        }

        function creaAsso(){
            if(!me.data['dcterms:hasPart'])return;
            //construction des liens
            let links = [];
            me.data['dcterms:hasPart'].forEach((p,numAsso) => {
                let js = JSON.parse(p['@value']);
                let m,posi, posiNext;
                js.data.forEach((n,i)=>{
                    //récupère la position du mot
                    //ATTENTION la sélection peut affecter les data si on passe par un objet selection
                    //IL FAUT TOUJOURS passer par d3.select
                    m = d3.select('#txtreeMot'+n.ordre);
                    posi = m.node().getBoundingClientRect();                
                    //ligne verticale
                    let x=(c)=>c.x+(c.width/2)-me.fontSize/4
                        ,yS=posi.y+posi.height/2+me.fontSize/2
                        ,yT=(c)=>c.y+c.height+numAsso*me.fontSize/2;
                    links.push({
                        'source':{'x':x(posi),'y':yS}
                        ,'target':{'x':x(posi),'y':yT(posi)}
                        ,'color':d3.color(colorLink(numAsso)).copy({opacity: 0.5})
                        ,'itemAsso':js.itemAsso
                        ,'id':'V_'+numAsso+'_'+i
                        ,'dir':'V'
                    });
                    //ligne horizontale
                    if(js.data.length > i+1){
                        posiNext = d3.select('#txtreeMot'+js.data[i+1].ordre).node().getBoundingClientRect();        
                        links.push({
                            'source':{'x':x(posi),'y':yT(posi)}
                            ,'target':{'x':x(posiNext)+me.fontSize/2,'y':yT(posiNext)}
                            ,'color':d3.color(colorLink(numAsso)).copy({opacity: 0.5})
                            ,'itemAsso':js.itemAsso
                            ,'id':'H_'+numAsso+'_'+i
                            ,'dir':'H'
                        });
                    }

                })
            });

            /*ATTENTION avec SVG masque le click
            divTexte.select('svg').remove();
            svg = divTexte.append('svg').style('height','100%').style('width','100%')
                .style('top','0px').style('left','0px').style('position','absolute');
            let RapportLinks = svg.selectAll("line").data(links).enter()
                .append("line")
                .attr('id', l =>'textreeLine'+l.id)
                .attr("x1", l => l.source.x)
                .attr("y1", l =>  l.source.y)
                .attr("x2", l =>  l.target.x)
                .attr("y2", l =>  l.target.y)
                .attr("stroke-width", 2)
                .style("stroke", l=>l.color ? l.color : 'black');  
            */

            //version div
            me.cont.selectAll('.txtTreeAssoLine').remove();
            let RapportLinks = me.cont.selectAll(".txtTreeAssoLine").data(links).enter()
                .append("div")
                .attr('class','txtTreeAssoLine')
                .attr('id', l =>'txtTreeAssoLine_'+l.id)
                .style('height',l=>l.dir=='H' ? me.fontSize/2+'px' : l.target.y - l.source.y+'px')
                .style('width',l=>l.dir=='H' ? l.target.x - l.source.x+'px' : me.fontSize/2+'px')
                .style('left',l=>l.source.x+'px')
                .style('top',l=>l.source.y+'px')
                .style('position','fixed')                
                .style("background-color", l=>l.color ? l.color : 'orange')
                .on('click',me.clickAsso);  
    
        }

        function creaText(){
            //ajoute le texte
            me.cont.selectAll('.txtree').remove();
            divTexte = me.cont.selectAll('.txtree').data([hierarchie]).enter().append("div")
                .attr("id", "txtreeMain")
                .attr("class", "txtree")
                //.style('height','100%')
                .style('float','left')
                .style('padding',me.fontSize+'px')
                .style('margin',me.fontSize+'px')
                .style('background-color',d => d.bgcolor = me.getColor(d.depth,opacity))
                .on('click',me.clickTexte);

            var divPhrases = divTexte.selectAll('.txtreePhrase').data(function(d){
                return d.children ? d.children : []
                }).enter().append("div")
                .attr("class", "txtreePhrase")
                .style('float','left')
                .style('min-height','54px')
                .style('padding',(me.fontSize/2)+'px')
                .style('padding-bottom',(me.fontSize)+'px')
                .style('margin-left',(me.fontSize/5)+'px')
                .style('margin-top',(me.fontSize/5)+'px')
                .style('background-color',d => d.bgcolor = me.getColor(d.depth,opacity))
                .style('color',d => d.color = me.getColor(d.depth,opacity,true))
                .text(function(d){
                    return d.children ? "" : d.data.txt;
                })
                .on('click',me.clickPhrase);

            var divMots = divPhrases.selectAll('.txtreeMot').data(function(d){
                return d.children ? d.children : []
                }).enter().append("div")
                .attr("class", "txtreeMot")
                .attr("id", (d,i)=>"txtreeMot"+i)
                .style('float','left')
                //.style('height',(me.fontSize*2)+'px')
                .style('padding',(me.fontSize/3)+'px')
                .style('padding-bottom',(me.fontSize)+'px')
                .style('margin-bottom',(me.fontSize/2*(me.data['dcterms:hasPart'] ? me.data['dcterms:hasPart'].length+1 : 1))+'px')
                .style('margin-left',(me.fontSize/10)+'px')
                .style('background-color',d => d.bgcolor = me.getColor(d.depth,opacity))
                .style('color',d => d.color = 'black'/*me.getColor(d.depth,opacity,true)*/)
                .text(function(d){
                    return d.children ? "" : d.data.txt;
                })
                .on('click',me.clickMot);
            var divCaract = divMots.selectAll('.txtreeCaract').data(function(d){
                    return d.children ? d.children : []; 
                }).enter().append("div")
                .attr("class", "txtreeCaract")
                .style('float','left')
                .style('height',(me.fontSize*1.5)+'px')
                .style('padding',(me.fontSize/4)+'px')
                .style('margin-left','1px')
                .style('font-size',(me.fontSize)+'px')
                .style('background-color',d => d.bgcolor = me.getColor(d.depth,opacity))
                .style('color',d => d.color = me.getColor(d.depth,opacity,true))
                .text(function(d){
                    return d.data.txt;
                })
                .on('click',me.clickCaract);
        }

        //fonctions pour gérer les évenements
        this.clickAsso = function(e,d){
            me.clickAssoFct(e, d);
            e.stopPropagation();
        }
        this.clickTexte = function(e,d){
            me.currentFct(e, d);
            e.stopPropagation();
        };
        this.clickPhrase = function(e,d){
            me.currentFct(e, d);
            e.stopPropagation();
        };
        this.clickMot = function(e,d){
            me.currentFct(e, d);
            e.stopPropagation();
        };
        this.clickCaract = function(e,d){
            me.currentFct(e, d);
            e.stopPropagation();
        };
        this.associer = function(e, d){
            let l = d3.select(e.currentTarget);
            if(l.style('background-color')=='green'){
                l.style('background-color',d.bgcolor);
                me.currentAsso=me.currentAsso.filter(a=>a.ordre!=d.ordre);
            }else{
                l.style('background-color','green');
                me.currentAsso.push(d.data);
            };    
        };

        // Fonction pour analyser le texte
        //merci à https://github.com/raitucarp/paratree
        this.analyseText = function() {
            if(me.langage == 'texte')
                me.dataTxt = {'txt':me.data['o:title'],'type':'paragraphe','children':me.parsePhrases(me.data['o:title'])};
            if(me.langage == 'gen')
                me.dataTxt = {'txt':me.data['o:title'],'type':'paragraphe','children':me.parseGen(me.data['o:title'])};
        }

        this.parseGen = function(text) {
            //extraction des générateurs
            //merci à https://openclassrooms.com/forum/sujet/regex-recuperer-texte-entre-crochets-57625
            let stc = text
                .match( /\[(.*?)\]/g )
                .map(function(t, i){return {'txt':t, 'type':'generateur', 'children':[]};});
            //ajout des textes suplémentaires
            let iDeb = 0, dataGen = [];
            for (let i = 0; i < stc.length; i++) {
                //récupère les positions du générateur
                let posi1 = text.indexOf(stc[i].txt, iDeb);
                let posi1fin = posi1+stc[i].txt.length;
                let posi2 = posi1+1;
                //ajout le texte avant le premier générateur
                if(i==0 && posi1 > 0){
                    dataGen = me.parsePhrases(text.substring(0,posi1));
                }
                //ajoute le générateur
                dataGen.push(stc[i]);
                //vérifie la présence de texte
                if(stc[(i+1)])
                    posi2 = text.indexOf(stc[(i+1)].txt, iDeb+1);                    
                if(posi2 > posi1fin){
                    //ajoute les textes intermédiaires
                    dataGen.push(me.parsePhrases(text.substring(posi1fin,posi2)));
                }
                iDeb = posi1fin;                
            }
            //ajout le texte après le dernier générateur
            if(iDeb < text.length){
                dataGen = dataGen.concat(me.parsePhrases(text.substring(iDeb)));
            }
            return dataGen;
        }        

        this.parsePhrases = function(text) {
            //vérifie si des phrases sont présentes
            if(text.match( /[^\.!\?]+[\.!\?]+/g ))
                return  text
                //merci à https://stackoverflow.com/questions/11761563/javascript-regexp-for-splitting-text-into-sentences-and-keeping-the-delimiter
                .match( /[^\.!\?]+[\.!\?]+/g )
                .map(function(t, i){return {'txt':t, 'type':'phrase', 'children':me.parseMots(t)};});
            else
                return [{'txt':text, 'type':'phrase', 'children':me.parseMots(text)}];

        }        

        this.parseMots = function(text) {
            if(text.match(/\s/gi))
                return text
                .split(/\s/gi)
                .map(function(t, i){
                    return {'txt':t, 'ordre':i, 'type':'mot', 'children':me.parseCaracteres(t)};
                });
            else
                return {'txt':text, 'ordre':0, 'type':'mot', 'children':me.parseCaracteres(text)};
        }        

        this.parseCaracteres = function(text) {
            let cs = false;            
            if(me.parseCaract){
                cs = text
                .split("")
                .map(function(t, i){
                    return {'i':i, 'txt':t, 'type':'caractere', 'children':[]};
                });    
            }
            return cs ;
        }        
          
        this.getColor = function(i,o,comp){
            if(comp)
                i = invNiv(i);
            let c = d3.color(color(i));
            c.opacity = o;
            return c;
        }

        this.init();
    }
}

  
