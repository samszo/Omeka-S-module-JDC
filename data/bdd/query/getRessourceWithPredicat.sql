SELECT 
    vRapport.id,
    vRapport.resource_id,
    p.label lblTypeRela,
    vProp.property_id,
    rtp.alternate_comment,
    vProp.value_resource_id,
    vPropTitle.value lblRela,
    vR.value_resource_id idSemPosi,
    vTopC.value_resource_id idTopConcept,
    vTopCTitle.value titreTopConcept
FROM
    value vRapport
        INNER JOIN
    value vProp ON vProp.resource_id = vRapport.resource_id
        INNER JOIN
    property p ON p.id = vProp.property_id
        INNER JOIN
    resource_template_property rtp ON rtp.property_id = vProp.property_id
        AND rtp.resource_template_id = 7
        AND rtp.alternate_comment IS NOT NULL
        INNER JOIN
    value vPropTitle ON vPropTitle.resource_id = vProp.value_resource_id
        AND vPropTitle.property_id = 1
        INNER JOIN
    value vR ON vR.property_id = vProp.property_id
        AND vR.value_resource_id = vProp.value_resource_id
        INNER JOIN
    value vTopC ON vTopC.property_id = 210
        AND vTopC.resource_id = vR.resource_id
        INNER JOIN
    value vTopCTitle ON vTopCTitle.resource_id = vTopC.value_resource_id
        AND vTopCTitle.property_id = 1
WHERE
    vRapport.property_id = 210
        AND vRapport.value_resource_id = 2072