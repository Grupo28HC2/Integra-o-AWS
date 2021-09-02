const fetch = require('node-fetch');
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-2'
});

// Instância DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
// DynamoDB Table
const dynamoTableName = "pedidos";

// Rotas
const order = "/order";
const order_created = "/order/new";
const get_order = "/order/getuserdata";
// Tratamento de Rotas
exports.handler = async function(event){
  console.log('Request de Evento', event);
  let response;
  switch(true){
    // Checa se as rotas estão funcionando
    case event.httpMethod === 'GET' && event.path === order:
        const body = "OK";
        response = buildResponse(200, body);
        break;
    case event.httpMethod === 'POST' && event.path === order:
        response = await createOrder(JSON.parse(event.body));
        break;
    case event.httpMethod === 'POST' && event.path === order_created:
        response = newOrder(JSON.parse(event.body));
        break;
    case event.httpMethod === 'POST' && event.path === get_order:
        response = newOrder(JSON.parse(event.body));
        break;
  }
  return response;
};

async function createOrder(requestContent){
    const data = {
      "orderId": requestContent.OrderId,
      "state": requestContent.State,
      "last_change": requestContent.LastChange
    };
    const params = {
      TableName: dynamoTableName,
      Item: data
    };
    return await dynamodb.put(params).promise().then(()=>{
        const body = {
          Operation: "Cadastro de Pedido",
          Message: "Salvo com Sucesso :D",
          Order: data
        };
        return newOrder(data);
    }, 
    (error) =>{
        console.error("Incapaz de armazenar Order", error);
    });
}

async function newOrder(requestBody){
    return await getOrderDetails(requestBody);
}

async function getOrderDetails(requestBody){
  const order_data = requestBody.orderId.toString();
  let email = '';
  const url = `https://hiringcoders202128.vtexcommercestable.com.br/api/oms/pvt/orders/${order_data}/conversation-message`;
  const options = {
    method: 'GET',
    headers: {
      Accept: '*/*',
      'X-VTEX-API-AppKey': 'vtexappkey-hiringcoders202128-OLBOEK',
      'X-VTEX-API-AppToken': 'YMYOVCEOIZAOCZUMDOWWRDDCWTYTCEOUUQMBONEHQJVYQYLNWKJKSZMVIWRCEKMDLFTLMTYQKOGHHFMYILXSVECVDRSSWCDGXRMKEZACMSADTFNDJSUSMUIHCYIVBFUH'
    }
  };
  await fetch(url, options)
  .then(res => res.json())
  .then(json => {
    email = json[0].to[0].email;
  })
  .catch(err => console.error('error:' + err));
  return await modifyLead(email);

}

async function modifyLead(email){
    const today = new Date();
    const date = today.getFullYear()+'/'+(today.getMonth()+1).toString().padStart(2, 0)+'/'+today.getDate();

    const params = {
        TableName: 'acct',
        Key: {
            'email': email
        },
        UpdateExpression: `set customer_date = :date`,
        ExpressionAttributeValues: {
            ':date': date,
        },
        ReturnValues: 'UPDATED_NEW'
    };
    
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'Atualização de Cliente',
            Message: "Atualizado com sucesso!",
            Item: response,
            Email: email
        };
        return buildResponse(200, body);
    },(error) =>{
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