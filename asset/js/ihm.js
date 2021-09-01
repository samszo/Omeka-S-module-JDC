/*TODO:définir urlAjax dans le module
urlAjax est défini dans le thème omeka S : JDC
*/

let oJDC=new jdc({}), contDim, toolTipAide, modalAjoutRapport, modalSelectDim;

function dimItemChange(dt){
    dt.checked=this.event.target.checked;
    dt.action=dt.checked ? 'appendDim' : 'removeDim';
    dt.idExi = oJDC.idExi; 
    dimSaveChange(dt);    
}
function dimSaveChange(dt){
    //gestion du loading
    d3.select('#dimItemSpin'+dt.idDim).style('display','block');
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
            }
            //ferme l'aide
            toolTipAide.close();
            //nécessaire avec le modal
            modalSelectDim.destroy();
            mnuContextRemove()
        } 
    })
    .fail(function(e) {
        console.log(e);
        d3.select('#dimItemSpin'+dt.idDim).style('display','none');
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
    d3.select('#ajoutItemSpin'+dim).style('display','block');
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
        d3.select('#ajoutItemSpin'+dim).style('display','none');
    });

}
