
function initModalCreerDetail(){
    d3.select('#btnAssoTxt').on('click',assoTxt);
    d3.select('#btnDissoTxt').on('click',function(){
    
    });
    d3.select('#btnCateTxt').on('click',cateTxt);
    switch (sltData.dim) {
        case 'Physique':
            d3.select('#nbDetailDim').style('display','block');
            d3.select('#modalCreerDetailTextTree').style('display','block');
            //construction des objets quand la modal est chargée 
            modalCreerDetailtt = new textree({'data':sltData,'idCont':'modalCreerDetailTextTree'});
            break;    
        case 'Concept':
            d3.select('#nbDetailDim').style('display','none');
            d3.select('#modalCreerDetailTextTree').style('display','none');
            showExploSkos(null,{'itemAsso':sltData.id});
            break;    
        default:
            break;
    }
    setAutoComplete('Physique');
    setAutoComplete('Actant');
    setAutoComplete('Concept');                

}
function cateTxt(){
    let l = d3.select(this);
    if(l.style('background-color')=='green'){
        l.style('background-color','');
        toolTipAide.close();
        modalCreerDetailtt.currentAsso = [];
        modalCreerDetailtt.currentFct = console.log;
        d3.select('#contCptRapports').style('display','none');
    }else{
        toolTipAide = new jBox('Tooltip',{
            target: '#txtreeMain',
            position: {
                x: 'center',
                y: 'bottom'
            },
        content:"<p>Sélectionner une association à catégoriser"
            +"</p>"       
        }).open();        
        l.style('background-color','green');
        modalCreerDetailtt.clickAssoFct = showExploSkos;
    };
}
function assoTxt(){
    let l = d3.select(this);
    if(l.style('background-color')=='green'){
        l.style('background-color','');
        toolTipAide.close();
        modalCreerDetailtt.currentAsso = [];
        modalCreerDetailtt.currentFct = console.log;
    }else{
        toolTipAide = new jBox('Tooltip',{
            target: '#txtreeMain',
            position: {
                x: 'center',
                y: 'bottom'
            },
        content:"<p>Sélectionner les éléments à associer puis"
            +" <button type='button' onclick='createDimTxtAsso(modalCreerDetailtt)' class='btn btn-primary'>Valider</button>"
            +" ou <button type='button' onclick='annulerTxtAsso()' class='btn btn-secondary'>Annuler</button>"
            +"</p>"       
        }).open();        
        l.style('background-color','green');
        modalCreerDetailtt.currentAsso = [];
        modalCreerDetailtt.currentFct = modalCreerDetailtt.associer;
    }
}   
function annulerTxtAsso(){
    d3.select('#btnAssoTxt').style('background-color','');
    d3.selectAll('.txtreeMot').style('background-color',d=>d.bgcolor);        
    toolTipAide.close();
    modalCreerDetailtt.currentAsso = [];
    modalCreerDetailtt.currentFct = console.log;        
}
function validerAsso(){
    console.log('validerAsso');
}
function showExploSkos(e,d){
    d3.select('#modalCreerDetailExploskos').style('display','block');
    d3.select('#contCptRapports').style('display','block');
    d3.select("#btnValiderAjoutSkos").on("click",()=>saveRapports(d));
    d3.select("#autocomplete_Physique_btnAjout").on("click",(e)=>ajouteDimForDetail(e,d));
    d3.select("#autocomplete_Actant_btnAjout").on("click",(e)=>ajouteDimForDetail(e,d));
    d3.select("#autocomplete_Concept_btnAjout").on("click",(e)=>ajouteDimForDetail(e,d));
    
    //supprime les précédends ajouts
    d3.selectAll('.addCptRapports').remove();
    cptRapports = [];

    if(toolTipAide)toolTipAide.close();
    showReseauConcept(d.itemAsso);        
}

function ajoutRowRapport(){
    let id = d3.select('#tableAjoutRapport').selectAll('tr').size();
    let r = d3.select('#tableAjoutRapport').append('tr').attr('id','rowAjoutRapport'+id);
    let dataCol = [
        {'type':'btnAction','id':id}
        ,{'type':'rdf','rdf':'sujet','id':id,'data':sltData}
        ,{'type':'rapports','id':id,'data':rapports}
        ,{'type':'rdf','rdf':'objet','id':id,'data':sltData}
    ];
    r.selectAll("td")
    .data(dataCol)
    .join("td").attr('id',(d,i)=>'colAjoutRapport'+id+i)
    .each((d,i) => {
        let s = d3.select('#colAjoutRapport'+id+i);
        switch (d.type) {
            case 'btnAction':
                //ajouter les boutons d'action
                s.attr('scope',"row").html('<i class="far fa-trash-alt" onclick="delRapport()"></i>');
                break;
            case 'rdf':
                //ajoute le menu
                createDropDownForRapport(s,d);
                break;
            case 'rapports':
                //ajoute le menu pour les rapports
                s.append('div').append('select')
                    .attr('id', 'sltCptRapports'+id)
                    .attr('class', 'form-control')
                    .on('change', e=>choixSPO(null,null,id))
                    .selectAll('option').data(rapports).enter()
                    .append('option').attr('value', o => o.id).text(o => o.term);
                break;
            default:
                break;
        }
    });

    //initialisation des autocomplete
    dataCol.forEach(d=>{
        if(d.AC){
            d.AC.forEach(ac=>setAutoComplete(ac.id,ac,choixSPO));
        }
    })

}
function createDropDownForRapport(t,d){
    d.ddId = 'MB_'+d.rdf+'_'+d.id;
    html = '<div class="dropdown">';
    html += '<button class="btn btn-secondary dropdown-toggle" type="button" id="dd'+d.ddId
        +'" data-bs-toggle="dropdown" aria-expanded="false">choisissez un '+d.rdf+'</button>';
    html += '<div class="dropdown-menu">';
    html += '<form class="px-4 py-3">';
    html += '<button type="button" class="btn btn-primary" id="btn'+d.ddId+'">'+d.data['o:title']+'</button>';
    html += '<div class="dropdown-divider"></div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Physique', d);
    html += '</div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Actant', d);
    html += '</div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Concept', d);
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    html += '<div id="result'+d.rdf+'_'+d.id+'">';
    html += '</div>';
    t.html(html);
    //ajoute les événements
    d3.select('#btn'+d.ddId).on('click',e=>choixSPO(d,null));

}
function createAutoCompleteForDim(dim,d){
    let id = 'createRapport'+dim+d.rdf+d.id;
    let idUrl = dim;
    let html = '<div class="ui-widget">';
    html += '<label for="autocomplete_'+id+'">Sélectionner / Ajouter un '+dim+' :</label>';
    html += '<div id="spin-'+id+'" style="display:none;" class="spinner-border spinner-border-sm" role="status">';
    html += '<span class="sr-only">Chargement...</span>';
    html += '</div>';
    html += '<input class="form-control" id="autocomplete_'+id+'" size="64">';
    //html += '<button id="autocomplete_'+id+'_btnAjout" class="btn btn-primary" type="button">Ajouter</button>';
    html += '</div>';
    if(!d.AC)d.AC=[];
    d.AC.push({'id':id,'idUrl':idUrl,'d':d});
    return html;
    
}

function choixSPO(d,val=null,sltCptId=null){
    if(sltCptId === null){
        let v = val ? val.label : d.data['o:title'];
        let id = val ? d.d.id : d.id;
        let rdf = val ? d.d.rdf : d.rdf;
        let idR = rdf+'_'+id;
        d3.select("#result"+idR).html(v);    
        if(!cptRapports[id])cptRapports[id]={'sujet':'','predicat':'','objet':''}
        cptRapports[id][rdf]=val ? val.id : d.data.id;
    }else{
        if(!cptRapports[sltCptId])cptRapports[sltCptId]={'sujet':'','predicat':'','objet':''}
        let idTerm = d3.select('#sltCptRapports' + sltCptId).property('value');
        let term = rapports.filter(r=>r.id==idTerm)[0];
        cptRapports[sltCptId]['predicat']=term;
    }
}