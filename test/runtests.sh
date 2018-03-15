#!/bin/sh
npm run generate_test_files
npm run clean_log
sh -c "npm run start_test" &
sleep 1
npm test
npm run jshint
