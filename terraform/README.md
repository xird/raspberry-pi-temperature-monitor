# SMS alert infrastructure

This Terraform configiration defines an API Gateway that can be called to trigger a Lambda function that will then send an SMS to subscribed phone numbers.

To package the Lambda function:

```
cd lambda
npm i
zip -r ../lambda_function.zip .
cd ..
```
