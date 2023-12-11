exports.assignTask = async (event) => {
    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);

    const { Client } = require('pg');
    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });
    client.connect();

    const newtask = JSON.parse(event.body)

    const taskid = (newtask.task_id)

    const assigne_id = (newtask.assigned_to_id)

    const startdate = (newtask.start_date)

    const enddate = (newtask.end_date)

    const updatedby = newtask.updated_by_id;
    const assignedby = newtask.assigned_by_id;
    const cmt = newtask.comments;

    try {
        const update = await client.query(`UPDATE tasks_table
   SET 
       assignee_id = '${assigne_id}', 
       task = 
           jsonb_set(jsonb_set(
               jsonb_set(
                   jsonb_set(
                       jsonb_set(
                           task, 
                           '{resource_start_date}', 
                           '"${startdate}"'::jsonb
                       ),
                       '{resource_end_date}', 
                       '"${enddate}"'::jsonb
                   ),
                   '{updated_by_id}', 
                   '"${updatedby}"'::jsonb
               ),
               '{assigned_by_id}', 
               '"${assignedby}"'::jsonb
           ), '{comments}', '"${cmt}"')
   WHERE 
       id = '${taskid}'`);


        client.end();
        return {

            "body": "success"

        }
    }
    catch (e) {


        client.end();

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "msg": "error"
        };

    }


}