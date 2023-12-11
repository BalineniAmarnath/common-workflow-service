exports.addStages = async (event, context, callback) => {
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
    
    await client.connect();
 
    try {
        const usecase_id = event.pathParameters.usecase_id;
 
        // Fetch the existing JSON data from the database
        const result = await client.query('SELECT id, usecase FROM usecases_table WHERE id = $1', [usecase_id]);
        const existingData = result.rows[0];
 
        // Parse the "teams" object from the request body
        const workflowobject = JSON.parse(event.body);
 
        // Update the JSON data with the provided "teams" object
        existingData.usecase.workflow = workflowobject;
 
        // Update the JSON data back to the database
        await client.query('UPDATE usecases_table SET usecase = $1 WHERE id = $2', [existingData.usecase, usecase_id]);
 
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data updated successfully' }),
        };
    } catch (error) {
        console.error('Error updating data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};