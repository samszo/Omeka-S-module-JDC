SELECT 
    r.id,
    vRapport.value_resource_id idRapport,
    vSujet.value_resource_id idSujet,
    vObjet.value_resource_id idObjet,
    vPred.value_resource_id idPred
FROM
    resource r
        INNER JOIN
    value vRapport ON vRapport.resource_id = r.id
        AND vRapport.property_id = 195
        INNER JOIN
    value vSujet ON vSujet.resource_id = vRapport.value_resource_id
        AND vSujet.property_id = 205
        INNER JOIN
    value vObjet ON vObjet.resource_id = vRapport.value_resource_id
        AND vObjet.property_id = 206
        INNER JOIN
    value vPred ON vPred.resource_id = vRapport.value_resource_id
        AND vPred.property_id = 207
WHERE
    r.id = 34 AND vSujet.value_resource_id = 7 
