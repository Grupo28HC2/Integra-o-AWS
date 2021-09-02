const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-2'
});

// Instância DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
// DynamoDB Table
const dynamoTableName = "acct";

// Rotas
const test = "/test";
const leads = "/leads";
const lead = "/lead";
const order = "/order";

// Tratamento de Rotas
exports.handler = async function(event){
  //console.log('Request de Evento', event);
  let response;
  switch(true){
    // Checa se as rotas estão funcionando
    case event.httpMethod === 'GET' && event.path === test:
        const body = {
          "Operation": "Teste API",
          "Message": "Tudo OK :D"
        };
        response = buildResponse(200, body);
        break;
    // Lista de todos os Leads cadastrados
    case event.httpMethod === 'GET' && event.path === leads:
        response = await getLeads();
        break;
    // Request de um lead específico
    case event.httpMethod === 'GET' && event.path === lead:
        response = await getLead(event.queryStringParameters.email);
        break;
    // Cadastro e Atualização de Item
    case event.httpMethod === 'PUT' && event.path === lead:
        response = await createEditLead(JSON.parse(event.body));
        break;
    // Remoção de Lead
    case event.httpMethod === 'DELETE' && event.path === lead:
        response = await deleteLead(JSON.parse(event.body).email);
        break;
    case event.httpMethod === 'POST' && event.path === order:
        response = await createOrder(JSON.parse(event.body));
        break;
    case event.httpMethod === 'GET' && event.path === order:
        response = buildResponse(200, {
          "Operation": 200,
          "Message": "OK"
        });
        break;
  }
  return response;
};

async function createOrder(requestBody){
  const params = {
    TableName: dynamoTableName,
    Item: requestBody
  };
  return await dynamodb.put(params).promise().then(()=>{
    const body = {
      Operation: "Cadastro de Prospecto",
      Message: "Salvo com Sucesso :D",
      Lead: requestBody
    };
    return buildResponse(200, body);
  }, (error) =>{
    console.error("Incapaz de armazenar Lead", error);
  });
  //return buildResponse(200, requestBody)
}

async function createEditLead(requestBody){
  const params = {
    TableName: dynamoTableName,
    Item: requestBody
  };
  return await dynamodb.put(params).promise().then(()=>{
    const body = {
      Operation: "Cadastro de Prospecto",
      Message: "Salvo com Sucesso :D",
      Lead: requestBody
    };
    return buildResponse(200, body);
  }, (error) =>{
    console.error("Incapaz de armazenar Lead", error);
  });
}

async function getLeads(){
  const params = {
    TableName: dynamoTableName
  };
  const allSubs = await scanDynamoRecords(params, []);
  const body = {
    prospectos: allSubs
  };
  return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray){
  try{
    const dynamoData = await dynamodb.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if(dynamoData.LastEvaluatedKey){
      scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  }catch(error){
    console.error("Incapaz de encontrar Leads", error);
  }
}

async function getLead(email){
  const params = {
    TableName: dynamoTableName,
    Key: {
      'email': email
    }
  };
  return await dynamodb.get(params).promise().then((response) =>{
    return buildResponse(200, response.Item);
  },(error) =>{
    console.error("Incapaz de encontrar Lead", error);
  });
}

async function deleteLead(email){
  const params = {
      TableName: dynamoTableName,
      Key: {
          'email': email
      },
      ReturnValues: 'ALL_OLD'
  };
  return await dynamodb.delete(params).promise().then((response)=>{
      const body = {
          Operation: "Exclusão de Prospecto",
          Message: "Prospecto removido com sucesso",
          Item: response
      };
      return buildResponse(200, body);
  },(error)=>{
      console.error("Incapaz de atualizar Lead", error);
  });
  
}

function buildResponse(statusCode, body){
return {
  statusCode: statusCode,
  headers: {
    'Content-type': 'application/json',
    'Access-Control-Allow-Origin': '*'

  },
  body: JSON.stringify(body)
};
}