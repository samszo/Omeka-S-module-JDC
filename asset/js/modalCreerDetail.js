
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
