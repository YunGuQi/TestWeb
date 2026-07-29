@echo off
npx -y -p @cloudbase/cli tcb db nosql execute -e test-backend-d8grj1s21652da209 --command "[{\"TableName\":\"ActivationCode\",\"CommandType\":\"INSERT\",\"Command\":\"{\\\"insert\\\":\\\"ActivationCode\\\",\\\"documents\\\":[{\\\"_id\\\":\\\"dummy\\\"}]}\"}]"
