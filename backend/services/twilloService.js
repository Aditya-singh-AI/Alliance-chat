const twillo = require("twilio");



// Twillo Crendential For env
const accountSid = process.env.TWILLO_ACCOUT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID; 

const   client = twillo(accountSid, authToken);


const sendOtpToPhoneNumber = async (phoneNumber) => {
    try {
       console.log('sending otp to this number', phoneNumber);
           if(!phoneNumber){
            throw new Error("Phone number is required");
           }
           const response = await client.verify.v2.services(serviceSid).verifications.create({
            to: phoneNumber,
            channel:"sms",
           })
        
        return response;
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error('Failed to send otp to this number');
    }
}

const verifyOtp = async (phoneNumber,otp) => {
    try {
       console.log('this is my otp', otp);
       console.log('this is my phoneNumber', phoneNumber);
       const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code:otp,
           });
           console.log("this is my otp response",response);
           return response;

    } catch (error) {   
        console.error(error);
        throw new Error('otp verification failed');
    }
}


module.exports = {sendOtpToPhoneNumber, verifyOtp}