const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'eu-north-1'});

exports.handler = async (event) => {
  console.log(event);
  const decoded = Buffer.from(event.body, 'base64').toString('utf-8');
  const { temperature } = JSON.parse(decoded);
  const message = `Veden lämpötila on pudonnut alle ${temperature} asteen.`;

  try {
    await sns.publish({
      Message: message,
      TopicArn: process.env.SNS_TOPIC_ARN,
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS.' }),
    };
  }
};
