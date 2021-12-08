const AWS = require('aws-sdk');
const Ajv = require('ajv');
const studentSchema = require('./studentSchema.json');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: new AWS.Endpoint('http://localhost:8000'),
  region: 'us-west-2',
  // what could you do to improve performance?
});

const tableName = 'SchoolStudents';

/**
 * The entry point into the lambda
 *
 * @param {Object} event
 * @param {string} event.schoolId
 * @param {string} event.schoolName
 * @param {string} event.studentId
 * @param {string} event.studentFirstName
 * @param {string} event.studentLastName
 * @param {string} event.studentGrade
 */
exports.handler = async event => {
  try {
    const student = {
      schoolId: event.schoolId,
      schoolName: event.schoolName,
      studentId: event.studentId,
      studentFirstName: event.studentFirstName,
      studentLastName: event.studentLastName,
      studentGrade: event.studentGrade,
    };
    const valid = ajv.compile(studentSchema);
    if (valid(student)) {
      await dynamodb
        .put({
          TableName: tableName,
          Item: student,
        })
        .promise();
      console.log('Success saving student');
    } else {
      console.log(valid.errors);
    }
  } catch (error) {
    console.log('An unexpected error occurred: ', error);
  }
};
