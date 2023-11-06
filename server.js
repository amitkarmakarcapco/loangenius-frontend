const express = require('express');
const fs = require('fs');
const session = require('express-session');
const app = express();
const port = 3000;

const customerData = JSON.parse(fs.readFileSync('customer.json', 'utf8'));

let userDetails = {
    name: null,
    customerID: null,
    currentLoanAmount: null,
    term: null,
    creditScore: null,
    householdIncome: null,
    yearsInCurrentJob: null,
    homeOwnership: null,
    loanType: null,
    monthlyDebt: null,
    yearsOfCreditHistory: null
};



app.use(express.json());

// Configure express-session middleware
app.use(session({
    secret: '12345', // Replace with a secret key for session encryption
    resave: false,
    saveUninitialized: true,
}));

// Define a route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/devs', (req, res) => {
    res.sendFile(__dirname + '/devs.html');
});

app.get('/chat', (req, res) => {
    // Use res.sendFile to serve an HTML page
    res.sendFile(__dirname + '/chat.html');
});

app.post('/answer', (req, res) => {
    answer = getAnswer(req);
    let nextQuestion = questions['q' + answer.nextQuestionNo];
    let reply = answer.reply;
    res.send({ nextQuestion, reply });
});

app.use(express.static(__dirname + '/public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


let questions = {
    q1: { qno: 1, q: "Are you an existing or a new customer?", prompts: ['Existing', 'New'] },
    q2: { qno: 2, q: "Ok. Please enter your customer id:", prompts: [] },
    q3: { qno: 3, q: "What is your credit score?. Enter 0 if you are not sure.", prompts: [] },
    q4: { qno: 4, q: "Do you have any ongoing loan? If yes, please enter the outstanding amount, otherwise enter 0.", prompts: [] },
    q5: { qno: 5, q: "What is your household income?", prompts: [] },
    q6: { qno: 6, q: "What is your montly debt?", prompts: [] },
    q7: { qno: 7, q: "And how many years are you continuing your current job?", prompts: [] },
    q8: { qno: 8, q: "Do you own any house?", prompts: ['Own Home', 'Home Mortgage', 'Rent'] },
    q9: { qno: 9, q: "What is your years of credit history?", prompts: [] },
    q10: { qno: 10, q: "What kind of loan you are looking for:", prompts: ["Business Loan", "Education Loan", "Home Loan", "Personal Loan", "Other"] },
    q11: { qno: 11, q: "And what is the amount that you need?:", prompts: [] },
    q12: { qno: 12, q: "Is the loan going to be short term or long term:", prompts: ['Short Term', 'Long Term'] },
    q13: { qno: 13, q: "Great! You are eligible for the loan and our representatives will shortly contact you for further processing.", prompts: ['End Chat'] },
    q14: { qno: 14, q: "We are sorry, but the eligibility criteria did not match for the loan you asked for. May be you require any of the following loans?", prompts: ["Shopping", "Vehicle", "Wedding", "Not interested"] },
    q15: { qno: 15, q: "And what is the amount that you need?:", prompts: [] },
    q16: { qno: 16, q: "We are sorry, but the eligibility criteria did not match for the loan you asked for.", prompts: ["End chat"] },
    q17: { qno: 17, q: "Thank you for your time. You may now close this chat window.", prompts: [] },

};

function getAnswer(req) {
    let nextQuestionNo = null, reply = null;
    const userResponse = req.body.userResponse;
    switch (req.body.questionNo) {
        case 0:
            req.session.userName = userResponse.trim().split(" ")[0];
            reply = "Welcome " + req.session.userName;
            nextQuestionNo = 1;
            break;
        case 1:
            nextQuestionNo = userResponse === "Existing" ? 2 : 3;
            reply = userResponse === "Existing" ? null : "No worries! We just need some information for the loan processing.";
            break;
        case 2:
            nextQuestionNo = 10;
            req.session.customerID = userResponse;
            const customer = customerData[userResponse];
            req.session.currentLoanAmount = customer.currentLoanAmount
            req.session.term = customer.term
            req.session.creditScore = customer.creditScore
            req.session.householdIncome = customer.householdIncome
            req.session.yearsInCurrentJob = customer.yearsInCurrentJob
            req.session.homeOwnership = customer.homeOwnership
            req.session.loanType = customer.loanType
            req.session.monthlyDebt = customer.monthlyDebt
            req.session.yearsOfCreditHistory = customer.yearsOfCreditHistory
            console.log(req.session);
            reply = req.session.userName + ", let me fetch your account details.";
            break;
        case 3:
            nextQuestionNo = 4;
            req.session.creditScore = userResponse;
            break;
        case 4:
            nextQuestionNo = 5;
            req.session.currentLoanAmount = userResponse;
            break;
        case 5:
            nextQuestionNo = 6;
            req.session.householdIncome = userResponse;
            break;
        case 6:
            nextQuestionNo = 7;
            req.session.monthlyDebt = userResponse;
            break;
        case 7:
            nextQuestionNo = 8;
            reply = "Bear with us please, " + req.session.userName;
            req.session.yearsInCurrentJob = userResponse;
            break;
        case 8:
            nextQuestionNo = 9;
            req.session.homeOwnership = userResponse;
            break;
        case 9:
            nextQuestionNo = 10;
            reply = "Thanks for the info, " + req.session.userName;
            req.session.yearsOfCreditHistory = userResponse;
            break;
        case 10:
            nextQuestionNo = 11;
            req.session.loanType = userResponse;
            break;
        case 11:
            nextQuestionNo = 12;
            req.session.amountRequested = userResponse;
            break;
        case 12:
            req.session.term = userResponse;
            const approval = getEligibility(req);
            reply = "Great! Lets check your eligibility for " + req.session.loanType + " for the amount of " + req.session.amountRequested;
            if (approval.approvedDesired) {
                nextQuestionNo = 13;
            } else if (approval.approvedLowRisk) {
                nextQuestionNo = 14;
            } else {
                nextQuestionNo = 16;
            }
            console.log(req.session);
            break;
        case 13:
            nextQuestionNo = 17;
            break;
        case 14:
            if(userResponse === "Not interested"){
                nextQuestionNo = 17;
            }else{
                nextQuestionNo = 15;
            }
            break;
        case 15:
            nextQuestionNo = 13;
            break;
        case 16:
            nextQuestionNo = 17;
            break;
        default:
            nextQuestionNo = null;
            reply = null;
    }
    return { nextQuestionNo, reply };
}

function getEligibility(req) {

    let approvedDesired = false;
    let approvedLowRisk = false;

    if (req.session.creditScore >= 578 && req.session.creditScore < 601) {
        approvedDesired = true;
        approvedLowRisk = true;
    }

    if (req.session.creditScore >= 601 && req.session.creditScore < 649) {
        approvedLowRisk = true;
    }

    if (req.session.creditScore >= 649) {
        approvedDesired = true;
        approvedLowRisk = true;
    }


    return { approvedDesired, approvedLowRisk };

}