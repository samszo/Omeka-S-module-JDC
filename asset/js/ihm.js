/*TODO:définir urlAjax dans le module
urlAjax est défini dans le thème omeka S : JDC
*/

let oJDC, contDim, toolTipAide;
function dimItemChange(dt){
    dt.checked=this.event.target.checked;
    if(!dt.checked && dt.dim=='Existence'){
        oJDC.clearExi();
        return
    }
    dt.action=dt.checked ? 'appendDim' : 'removeDim';
    dt.idExi = oJDC.idExi; 
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
        if(!dt.checked){
            oJDC.removeDim(dt, data);
        }else{
            oJDC.appendDim(dt, data);
            if(dt.dim=='Existence'){
                Object.keys(oJDC.data).forEach(d=>{
                    //active les menus
                    d3.select('#ddJDC'+d).attr('class','nav-link dropdown-toggle')
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

        } 
    })
    .fail(function(e) {
        console.log(e);
        d3.select('#dimItemSpin'+dt.idDim).style('display','none');
    });

}
function appendDimSelector(dim,item,idExi){
    //ajoute l'item dans le menu
    let dimS = d3.select('#dimSelector'+dim).append('div').attr('class',"form-check");                
    dimS.append('input').attr('type',"checkbox").attr('url',item['@id']).attr('checked',true)
        .attr('class',"form-check-input iss").attr('id','ddcJDC'+item['o:id'])
        .on('change',e=>dimItemChange({'idDim':item['o:id'], 'idExi':idExi, 'dim':dim}));
    dimS.append('label').attr('class',"form-check-label").attr('for',"ddcJDC"+item['o:id'])
        .html(item['o:title']);
    dimS.append('i').attr('id','dimItemSpin'+item['o:id']).style('display','none').attr('class',"fas fa-cog fa-spin");
}

function createDim(id, dim){
    console.log('createDim',[id, dim]);
    d3.select('#ajoutItemSpin'+dim).style('display','block');
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: urlAjax,
        data: {
            'dim': dim,
            'id': id,
            'idExi': dim=="Existence" ? null : oJDC.idExi,
            'action': 'createDim',
            'data':{'dcterms:title':'New '+dim+" - "+Date.now()}                    
        }
    })
    .done(function(item) {
        console.log(item);
        appendDimSelector(dim,item,dim=="Existence" ? null : oJDC.idExi)
        d3.select('#ajoutItemSpin'+dim).style('display','none');
    })
    .fail(function(e) {
        console.log("error = "+JSON.stringify(e));
        d3.select('#ajoutItemSpin'+dim).style('display','none');
    });

}
