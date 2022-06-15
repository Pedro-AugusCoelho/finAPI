const express =  require('express');
const {v4 : uuidv4} = require('uuid');

const app = express();

app.use(express.json());

const customers = [{
    id:'1',
    cpf:'555',
    name:'Pedro A',
    statement: [],
}];

// Middleware
const verifyExistsAccountCPF = (request , response , next) => {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error:"Customer not found"});
    }

    request.customer = customer;

    return next();

}

const getBalance = (statement) => {
    const balance = statement.reduce( (acc , operation) => {
        if(operation.type === 'credited'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    },0);

    return balance;
}

app.post('/account' , (request , response) => {
    
    const {cpf , name} = request.body;
    
    const CustomersCpfExists = customers.some(item => item.cpf === cpf);
    
    if(CustomersCpfExists){
        return response.status(400).json({error:"Costumers Already Exists"}); 
    }
    
    customers.push({
        id:uuidv4(),
        cpf,
        name,
        statement: []
    });

    return response.status(201).send();
});

app.get('/statement' , verifyExistsAccountCPF , (request , response) => {

    const { customer } = request;

    return response.json(customer.statement);
});

app.post('/deposit' ,verifyExistsAccountCPF , (request , response) => {
    
    const { description , amount } = request.body;

    console.log(description);
    
    const { customer } = request;

    const statementOperation = {
        type: 'credited',
        description,
        amount,
        createdAt: new Date(),
    };

    customer.statement.push(statementOperation);


    response.status(201).send();

});

app.post('/withdraw' ,verifyExistsAccountCPF , (request , response) => {
    
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);
    if(balance < amount){
        return response.status(400).json({error: "insufficient funds! "})
    }

    const statementOperation = {
        type: 'debit',
        amount,
        createdAt: new Date(),
    };

    customer.statement.push(statementOperation);
    response.status(201).send();

});

app.get('/statement/date' , verifyExistsAccountCPF , (request , response) => {

    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        statement => 
            statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement);
});

app.put('/account', verifyExistsAccountCPF , (request , response) => {
    const {name} = request.body;
    const { customer } = request;

    customer.name = name;

    response.status(201).send();
});

app.get('/account', verifyExistsAccountCPF , (request , response) => {
    const { customer } = request;

    return response.json(customer);


});

app.delete('/account', verifyExistsAccountCPF ,(request , response) => {
    
    const { customer } = request;

    customers.splice(customer , 1);

    return response.status(200).json(customers);

});

app.get('/balance', verifyExistsAccountCPF ,(request , response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.status(200).json(balance);
});



app.listen('3333');
