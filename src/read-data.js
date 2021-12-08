const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: new AWS.Endpoint('http://localhost:8000'),
  region: 'us-west-2',
  // what could you do to improve performance?
  // Something like below might help
  maxRetries: 10,
  httpOptions: {
    timeout: 5000,
  },
});

const tableName = 'SchoolStudents';
const studentLastNameGsiName = 'studentLastNameGsi';

/**
 * The entry point into the lambda
 *
 * @param {Object} event
 * @param {string} event.schoolId
 * @param {string} event.studentId
 * @param {string} [event.studentLastName]
 */
exports.handler = async event => {
  try {
    const key = event.studentLastName ? 'studentLastName' : 'schoolId';
    const params = {
      TableName: tableName,
      ...(key === 'studentLastName' && { IndexName: studentLastNameGsiName }),
      KeyConditionExpression: `#${key} = :v_${key}`,
      ExpressionAttributeNames: {
        [`#${key}`]: key,
      },
      ExpressionAttributeValues: {
        [`:v_${key}`]: key === 'studentLastName' ? event.studentLastName : event.schoolId,
      },
      Limit: 5,
    };
    const allItems = [];
    let res = null;
    do {
      res = await dynamodb.query(params).promise();
      params.ExclusiveStartKey = res.LastEvaluatedKey;
      allItems.push(...res.Items);
    } while (res.LastEvaluatedKey);

    return allItems;
  } catch (error) {
    console.log(error);
  }
};
