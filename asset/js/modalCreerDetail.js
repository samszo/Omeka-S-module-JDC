
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
    let r = d3.select('#tableAjoutRapport').append('tr');
    r.append('th').attr('scope',"row").html('<i class="far fa-trash-alt" onclick="delRapport()"></i>');
    r.append('td').html(createDropDownForRapport('choisissez un sujet','AjoutSujet1'));
    r.append('td').append('div').append('select')
        .attr('id', d => 'sltCptRapports')
        .attr('class', 'form-control')
        .on('change', choixRapport)
        .selectAll('option').data(rapports).enter()
        .append('option').attr('value', o => o.id).text(o => o.term);
    r.append('td').html(createDropDownForRapport('choisissez un objet','AjoutObjet1'));
    setAutoComplete('PhysiqueajoutObjet1');

}
function createDropDownForRapport(titre, id){


    html = '<div class="dropdown">';
    html += '<button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">'+titre+'</button>';
    html += '<div class="dropdown-menu">';
    html += '<form class="px-4 py-3">';
    html += '<button type="submit" class="btn btn-primary">'+sltData['o:title']+'</button>';
    html += '<div class="dropdown-divider"></div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Physique', id);
    html += '</div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Actant', id);
    html += '</div>';
    html += '<div class="mb-3">';
    html += createAutoCompleteForDim('Concept', id);
    html += '</div>';
    html += '</form>';
    html += '</div>';

    html += '</div>';

    return html;
}
function createAutoCompleteForDim(dim, id){
    let html = '<div class="ui-widget">';
    html += '<label style="color:white;" for="autocomplete__'+dim+id+'">Sélectionner / Ajouterun '+dim+' :</label>';
    html += '<div id="spin-autocomplete_'+dim+id+' style="display:none;color:white" class="spinner-border spinner-border-sm" role="status">';
    html += '<span class="sr-only">Chargement...</span>';
    html += '</div>';
    html += '<input class="form-control" id="autocomplete_'+dim+id+'" size="64">';
    html += '<button id="autocomplete_'+dim+id+'_btnAjout" class="btn btn-primary" type="button">Ajouter</button>';
    html += '</div>';
    return html;
}