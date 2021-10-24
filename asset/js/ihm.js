/*TODO:définir urlAjax dans le module
urlAjax est défini dans le thème omeka S : JDC
*/

let oJDC=new jdc({}), contDim, toolTipAide, modalAjoutRapport, modalSelectDim, sltData, rapports, cptRapports=[], item;

function initIhmJdc(){
    contDim = d3.select('#jdcGraph').node().getBoundingClientRect();
    //gestion du menu contextuel
    mnuContextCont = d3.select('body').append('div')
      .attr('id','jdcMenuContext')
      .style('position','absolute');
    //ajouter le JDC 
    oJDC = new jdc({'idCont':'jdcGraph','width':contDim.width,'height':600
      ,'fctCreaDim':createDim,'fctClickDim':mnuContextInit, 'fctUpdateDim':updateDim
      , 'apiUrl':urlAjax});
    //gestion des modals
    modalAjoutRapport = new bootstrap.Modal(document.getElementById('modalAjoutRapport'));
    modalPatienter = new bootstrap.Modal(document.getElementById('modalPatienter'));
    //pour gérer les événements d'ouverture
    modalCreerDetailNode = document.getElementById('modalCreerDetail')
    modalCreerDetail = new bootstrap.Modal(modalCreerDetailNode);
    modalCreerDetailNode.addEventListener('shown.bs.modal', function (event) {
      initModalCreerDetail();
    }) 
    //gestion des tooltip
    if(!item){
        mnuContextShow(contDim.left-mnuContextWidth/2+contDim.width/2, contDim.top+mnuContextWidth/2, mnuContextData.start);
        toolTipAide = new jBox('Tooltip',{
            target: '#jdcMenuContext',
            position: {
                x: 'center',
                y: 'top'
            },
            content:'Pour commencer créer ou sélectionner une existence'       
          }).open();        
    }else{
        dimSaveChange({'action':'appendDim','idDim':item['o:id'],'dim':'Existence'});
    }
}

function dimItemChange(dt){
    dt.checked=this.event.target.checked;
    dt.action=dt.checked ? 'appendDim' : 'removeDim';
    dt.idExi = oJDC.idExi; 
    dimSaveChange(dt);    
}
function dimSaveChange(dt){
    //gestion du loading
    modalPatienter.show();
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt,
    }).done(function(data) {
        console.log(data);        
        d3.select('#dimItemSpin'+dt.idDim).style('display','none');
        if(dt.action=='removeDim'){
            oJDC.removeDim(dt, data);
        }else{
            oJDC.appendDim(dt, data);
            if(dt.dim=='Existence'){
                Object.keys(oJDC.data).forEach(d=>{
                    //active les menus
                    if(d!="Existence")d3.select('#ddJDC'+d).attr('class','nav-link dropdown-toggle')
                    //coche les cases des menus des dimensions présentes
                    Object.keys(oJDC.hierarchies).forEach(h=>{
                        oJDC.hierarchies[h].descendants().forEach(d=>{
                            d3.select('#ddcJDC'+d.data.id).attr('checked','true')
                        });
                    });                                  
                }); 
                if(modalSelectDim)modalSelectDim.destroy();
            }
            //ferme l'aide
            if(toolTipAide)toolTipAide.close();
        } 
        mnuContextRemove();
    })
    .fail(function(e) {
        console.log(e);
        d3.select('#dimItemSpin'+dt.idDim).style('display','none');
    })
    .always(function() {
        modalPatienter.hide();
    });
}

function appendDimSelector(rs,idExi){
    //ajoute l'item dans le menu
    for (const dim in rs) {
        let dimS = d3.select('#dimSelector'+dim).append('div').attr('class',"form-check");
        rs[dim].forEach(item=>{
            dimS.append('input').attr('type',"checkbox").attr('url',item['@id']).attr('checked',true)
            .attr('class',"form-check-input iss").attr('id','ddcJDC'+item.id)
            .on('change',e=>dimItemChange({'idDim':item.id, 'idExi':idExi, 'dim':dim}));
            dimS.append('label').attr('class',"form-check-label").attr('for',"ddcJDC"+item.id)
                .html(item['o:title']);
            dimS.append('i').attr('id','dimItemSpin'+item.id).style('display','none').attr('class',"fas fa-cog fa-spin");
        });                
    }
      
}

function createDim(id, dim, data){
    console.log('createDim',[id, dim]);
    modalPatienter.show();
    if(dim=='Rapport' && !data){
        oJDC.selectRapportDim(false,false);
        return
    }
    let dt = {
        'dim': dim,
        'id': id,
        'idExi': dim=="Existence" ? null : oJDC.idExi,
        'action': 'createDim',
        'data':data ? data : {'dcterms:title':'New '+dim+" - "+Date.now()}                    
    }
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt
    })
    .done(function(rs) {
        console.log(rs);
        oJDC.appendDim(dt, rs);
        if(dim=="Rapport")oJDC.clearRapportDim();
        /*nécessaire avec le menu 
        //appendDimSelector(rs,dim=="Existence" ? null : oJDC.idExi)
        //active les menus
        if(dim=="Existence"){
            Object.keys(rs).forEach(d=>{
                if(d!="Existence")d3.select('#ddJDC'+d).attr('class','nav-link dropdown-toggle')
            });
        }
        d3.select('#ajoutItemSpin'+dim).style('display','none');
        */
       //nécessaire avec le modal
       mnuContextRemove();
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
    })
    .always(function() {
        modalPatienter.hide();
    });

}
function updateDim(dt){
    modalPatienter.show();
    $.ajax({
        dataType: 'json',
        url: dt.apiUrl,
    })
    .done(function(rs) {
        console.log(rs);
        //vérifie la modification 
        if(dt["o:modified"]["@value"]!=rs["o:modified"]["@value"]){
            //recharge l'existence
            dimSaveChange({
                action: "appendDim",
                checked: true,
                dim: "Existence",
                idDim: oJDC.idExi,
                idExi: oJDC.idExi,
                idItem: oJDC.idExi
            });
        }
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
    })
    .always(function() {
        modalPatienter.hide();
    });

}
function createDimTxtAsso(tt){
    modalPatienter.show();
    if(!tt.currentAsso || tt.currentAsso.length == 0 ){
        toolTipAide.content.append('<div class="alert alert-warning" role="alert">Veuillez sélectionner au moins 1 élement.</div>');
        return false
    }
    let dt = {
        'id': tt.data.id,
        'dim': tt.data.dim,
        'action': 'createDimTxtAsso',
        'data':tt.currentAsso                    
    }
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt
    })
    .done(function(rs) {
        console.log(rs);
        tt.updateAsso(rs);
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
        toolTipAide.content.append('<div class="alert alert-danger" role="alert">ERREUR:'+e.status+'<p>'+e.responseText+'</p></div>');
    })
    .always(function() {
        modalPatienter.hide();
        annulerTxtAsso();
    });

}

function setAutoComplete(id){

    $("#autocomplete_"+id)
            // don't navigate away from the field on tab when selecting an item
            .on("keydown", function (event) {
                    if (event.keyCode === $.ui.keyCode.TAB &&
                            $(this).autocomplete("instance").menu.active) {
                            event.preventDefault();
                    }
            })
            .autocomplete({
                    minLength: 3,
                    source: function (request, response) {
                            searchTerm = request.term;
                            d3.select('#spin-'+id).style('display', 'inline-block');
                            d3.select('#icon-'+id).style('display', 'none');
                            $.ajax({
                                    url: urlsAutoComplete[id] + searchTerm,
                                    dataType: "json",
                                    success: function (data) {
                                            d3.select('#spin-'+id).style('display', 'none');
                                            d3.select('#icon-'+id).style('display', 'inline-block');
                                            let rs = data.map(d => {
                                                    return {
                                                            'value': d['o:title'],
                                                            'id': d['o:id']
                                                    }
                                            })
                                            response(rs);
                                    }
                            })
                    },
                    focus: function () {
                            // prevent value inserted on focus
                            return false;
                    },
                    select: function (event, ui) {
                            drawRapport(ui.item);
                            this.value = "";
                            return false;
                    },
            }).data("ui-autocomplete")._renderItem = function (ul, item) {
                    const regex = new RegExp(searchTerm, "gi");
                    let html = '<a>' + item.label.replace(regex, '<span class="findTerm">' + searchTerm + '</span>') + '</a>';
                    return $("<li></li>")
                            .data("item.autocomplete", item)
                            .append(html)
                            .appendTo(ul);
            };
  }
function showReseauConcept(id){
    console.log('getReseauConcept');
    modalPatienter.show();
    let dt = {
        'id': id,
        'action': 'getReseauConcept',
    }
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt
    })
    .done(function(rs) {
        console.log(rs);
        cartoExploSkos = new exploskos({
            'idCont': 'modalCreerDetailExploskos',
            'height':400,
            'margin': {top: 10, right: 10, bottom: 10, left: 10},            
            'data': rs.dataReseauConcept,
            });
        rapports=rs.cptRapports;            
        //met à jour le type de rapports
        d3.select('#ajoutConceptLabel').text("Relier « "+rs.item['o:title']+" » à d'autres dimensions");
        modalPatienter.hide();
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
        toolTipAide.content.append('<div class="alert alert-danger" role="alert">ERREUR:'+e.status+'<p>'+e.responseText+'</p></div>');
        modalPatienter.hide();
    });
}
function saveRapports(asso) {
    let cancel = false;
    cptRapports.forEach((r,i) => {
            if(!r.rapport){
                    cancel = true;
                    $('#alertChoixRapport'+i).show();                      
            }  
    });
    if(cancel)return;
    modalPatienter.show();
    $.ajax({
            type: 'POST',
            dataType: 'json',
            url: urlAjax,
            data: {
                'rt':'JDC Rapports entre concepts',
                'id': asso.itemAsso,
                'user': user,
                'rapports': cptRapports,
                'action': 'createSkosRapports',
            }
    }).done(function(data) {
        d3.select("#contAddCptRapports").selectAll('.addCptRapports').remove();        
        cartoExploSkos.draw(data.dataReseauConcept);
    })
    .fail(function(e) {
            throw new Error("Sauvegarde imposible : " + e);
    })
    .always(function() {
        modalPatienter.hide();
    });
}

function drawRapport(item) {
    cptRapports.push(item);
    let colGen = d3.select("#contAddCptRapports")
        .selectAll('.addCptRapports').data(cptRapports).enter()
        .append('div').attr('class', 'row addCptRapports')
        .append('div').attr('class', 'col-12');
    r = colGen.append('div')
        .attr('id', d => 'rChoixRapport' + d.id)
        .attr('class', 'row')
    let colName = r.append('div').attr('class', 'col-5');
    colName.append('span')
        .text(d => d.value)
    let colChoix = r.append('div').attr('class', 'col-6');
    colChoix.append('select')
        .attr('id', d => 'sltCptRapports' + d.id)
        .attr('class', 'form-control')
        .on('change', choixRapport)
        .selectAll('option').data(rapports).enter()
        .append('option').attr('value', o => o.id).text(o => o.term);
    let colButton = r.append('div').attr('class', 'col-1');
    colButton.append('span')
            .style("cursor", "pointer")
            .on('click',delRapport)
            .append('i')
            .attr('class', 'far fa-trash-alt');
    
    let rAlert = colGen.append('div')
        .attr('id', d => 'rChoixRapportA' + d.id)
        .attr('class', 'row');
    let colAlert = rAlert.append('div')
        .attr('class', 'col-12');
    colAlert.append('div')
        .attr('class', "alert alert-danger alertRapport")
        .attr('id', d => "alertChoixRapport" + d.id)
        .attr('role', 'alert')
        .text('Veuillez choisir/supprimer un rapport...');
    colAlert.append('div')
        .attr('class', "alert alert-danger alertRapport")
        .attr('id', d => "alertExisteRapport" + d.id)
        .attr('role', 'alert')
        .text('Ce rapport existe déjà : supprimer ou remplacer');
    colAlert.append('div')
        .attr('class', "alert alert-warning alertRapport")
        .attr('id', d => "alertCoherenceRapport" + d.id)
        .attr('role', 'alert')
        .text('Le rapport existant sera modifié...');
    colAlert.append('div')
        .attr('class', "alert alert-success alertRapport")
        .attr('id', d => "alertAjoutRapport" + d.id)
        .attr('role', 'alert')
        .text('Le rapport sera ajouté...');
    colAlert.append('div').attr('class', "dropdown-divider");
}

function delRapport(e, d) {
    cptRapports=cptRapports.filter(r=>r.id!=d.id);
    d3.select('#rChoixRapportA' + d.id).remove();
    d3.select('#rChoixRapport' + d.id).remove();
}

function choixRapport(e, d) {
    let idTerm = d3.select('#sltCptRapports' + d.id).property('value');
    d3.select('#btnValiderAjoutSkos')
        .attr('class', 'btn btn-dark disabled')
        .attr('aria-disabled', 'true');
    if (existeRapport(d, r)) {
        $('#alertCoherenceRapport' + d.id).hide();
        $('#alertAjoutRapport' + d.id).hide();
        $('#alertExisteRapport' + d.id).show();
    } else if (!coherenceRapport(d, r)) {
        $('#alertCoherenceRapport' + d.id).show();
        $('#alertAjoutRapport' + d.id).hide();
        $('#alertExisteRapport' + d.id).hide();
        d3.select('#btnValiderAjoutSkos')
            .attr('class', 'btn btn-dark')
            .attr('aria-disabled', 'false');
        d.rapport = {
            'term': rapports.filter(r=>r.id==idTerm)[0].term,
            'action': 'replace'
        };
    } else {
        d.rapport = {
            'term': rapports.filter(r=>r.id==idTerm)[0].term,
            'action': 'append'
        };
        $('#alertExisteRapport' + d.id).hide();
        $('#alertCoherenceRapport' + d.id).hide();
        $('#alertAjoutRapport' + d.id).show();
        d3.select('#btnValiderAjoutSkos')
            .attr('class', 'btn btn-dark')
            .attr('aria-disabled', 'false');
    }
    $('#alertChoixRapport' + d.id).hide();
}

function existeRapport(d, r) {
    if (!cartoExploSkos.noeudBase.liens.length) return false;

    let noeuds = cartoExploSkos.data.nodes.filter(
        n => n["o:item"] && n['o:item']["o:id"] == d.id);
    if (!noeuds.length) return false;

    let liens = cartoExploSkos.noeudBase.liens.filter(
        l => l["term"] == r && l["id"] == noeuds[0]["id"]);
    return liens.length;
}

function coherenceRapport(d, r) {
    if (!cartoExploSkos.noeudBase.liens.length) return true;

    let noeuds = cartoExploSkos.data.nodes.filter(
        n => n["o:item"] && n['o:item']["o:id"] == d.id);
    if (!noeuds.length) return true;

    let liens = cartoExploSkos.noeudBase.liens.filter(
        l => l["id"] == noeuds[0]["id"]);
    return liens.length == 0;
}
function ajouteDimForDetail(e, d){
    modalPatienter.show();
    let idTarget = e.currentTarget.id;
    let dim = idTarget.split('_')[1];
    let title = document.getElementById('autocomplete_'+dim).value;
    let dt = {
        'dim': dim,
        'justeDim': true,
        'action': 'createDim',
        'data':{'dcterms:title':title}                    
    }
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt
    })
    .done(function(rs) {
        drawRapport({'value': rs['o:title'],'id': rs.id});
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
    })
    .always(function() {
        modalPatienter.hide();
    });
}
function generer(d){
    modalPatienter.show();
    let dt = {
        'idExi': oJDC.idExi,
        'action': 'generer',
        'data': d.slt.data ? d.slt.data : d.slt,
        'paramsGen':['replaceSamePredicatValue']
    }
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: dt
    })
    .done(function(rs) {
        oJDC.data.Generation.push(rs);
        oJDC.addGenerations();
        console.log(rs);
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
    })
    .always(function() {
        modalPatienter.hide();
    });

}