const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  "username": String,
});

const exerciseSchema = new mongoose.Schema({
  "username": String,
  "date": Date,
  "duration": Number,
  "description": String
});

const logSchema = new mongoose.Schema({
  "username": String,
  "count": Number,
  "log": Array
});

const UserInfo = mongoose.model("userinfo", userSchema);

const ExerciceInfo = mongoose.model("exerciceinfo", exerciseSchema);

const LogInfo = mongoose.model("loginfo", logSchema);
const mySecret = process.env['MONGODB_URI']

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("connected to mongoDB success"))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  UserInfo.find({ "username": req.body.username }, (err, userData) => {
    if (err) {
      console.log(err);
    } else {
      if (userData.length === 0) {
        const test = new UserInfo({
          "username": req.body.username
        });
        test.save((err, data) => {
          if (err) {
            console.log(err)
          } else {
            res.json({
              "_id": data._id,
              "username": data.username
            })
          }
        })
      } else {
        res.send("l'utilisateur existe déja")
      }
    }
  })
});

app.get("/api/users", (req, res) => {
  UserInfo.find({}, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      res.send(data)
    }
  });

})

app.post("/api/users/:_id/exercises", (req, res) => {
  let idJson = { "id": req.params._id };
  let checkedDate = new Date(req.body.date);
  let idToCheck = idJson.id;

  let noDateHandler = () => {
    if (checkedDate instanceof Date && !isNaN(checkedDate)) {
      return checkedDate
    } else {
      checkedDate = new Date();
    }
  }

  UserInfo.findById(idToCheck, (err, data) => {
    noDateHandler(checkedDate);
    if (err) {
      console.log(err);
    } else {
      const test = new ExerciceInfo({
        "username": data.username,
        "description": req.body.description,
        "duration": req.body.duration,
        "date": checkedDate.toDateString(),
      });
      test.save((err, data) => {
        if (err) {
          console.log(err)
        } else {
          res.json({
            "_id": idToCheck,
            "username": data.username,
            "description": data.description,
            "duration": data.duration,
            "date": data.date.toDateString()
          })
        }
      })
    }
  })

})

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const idJson = { "id": req.params._id };
  let idToCheck = idJson.id;

  UserInfo.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username,
    }

    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from) }
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to) }
    }
    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit;
      }
    }

    if (err) {
      console.log(err)
    } else {
      ExerciceInfo.find(query, null, { limit: limitChecker(+limit) }, (err, docs) => {
        let loggedArray = [];
        if (err) {
          console.log(err)
        } else {
          let documents = docs;
          loggedArray = documents.map((doc) => {
            return {
              "description": doc.description,
              "duration": doc.duration,
              "date": doc.date.toDateString()
            }
          });
          const test = new LogInfo({
            "username": data.username,
            "count": loggedArray.length,
            "log": loggedArray
          });
          test.save((err, data) => {
            if (err) {
              console.log(err);
            } else {
              res.json({
                "_id": idToCheck,
                "username": data.username,
                "count": data.count,
                "log": loggedArray
              })
            }
          })
        }
      })
    }
  })

})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
