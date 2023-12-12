exports.handler=async(event)=>
{
const {Client}=require('pg')
const client=new Client({
    host:"localhost",
    user:"postgres",
    database:"vinay",
    port:"5432",
    password:"2402"

})
client.connect();
let res={
    status:200,
    result:"success",
  
    project:[],
    totaltasks:[],
    managerrole:[],
    resource:[]
}

const status=event.queryStringParameters.status
try{
    
    const data=await client.query(`SELECT
    p.id AS project_id,
    p.project->>'name' AS project_name,
    p.project->>'project_manager' AS manager,
    (
        SELECT COALESCE(SUM(COALESCE(JSONB_ARRAY_LENGTH(value->'tasks'), 0)), 0)
        FROM JSONB_EACH(project->'stages')
    ) AS total_tasks,
    p.project->>'start_date' AS startdate,
    p.project->>'end_date' AS duedate,
    r.id AS resource_id,
    r.resource->'current_task'->>'task_name' AS currenttask
FROM
    projects_table p
JOIN
    tasks_table t ON p.id = t.project_id
JOIN
    resources_table r ON t.assignee_id = r.id
 WHERE
    r.resource->>'role' = 'Manager' AND p.project->>'status'=$1`,[status]);

console.log(data.rows)
const len=data.rows.length
for(let i=0;i<len;i++)
{
    let resource=[];
let pname=data.rows[i].project_name

    const resource1=await client.query(`SELECT r.resource->>'name' AS resource_name,r.id as resourceid,r.resource->>'image' as resourceimage, r.resource ->>'role' as role1, t.stage, p.project->>'name' AS project_name
    FROM
        resources_table r
    JOIN
        tasks_table t ON r.id = t.assignee_id
    JOIN
        projects_table p ON t.project_id = p.id
       where 
       r.resource ->>'role'<>'Manager' AND p.project->>'name'=$1`,[pname]);
       for(let j=0;j<resource1.rows.length;j++)
       {
        resource.push({resourcename: resource1.rows[j].resource_name, resourceimg: resource1.rows[j].resourceimage, resourceid: resource1.rows[j].resourceid} )
       }
       data.rows[i].resourcedet=resource;
   
   
}
   
  

client.end();
return {
    "body":JSON.stringify(data.rows)
}
    } 
catch(e)
{
    client.end();
    
    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin":"*"
        },
       "msg":"error"
    };
    
}




}