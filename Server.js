/*express code*/
const express = require("express"); //include express
const app = express(); // make server

/*compression & helmet*/
const comp = require("compression");
const helmet = require("helmet");

/*express-validator*/
const { body, validationResult } = require("express-validator"); //using express-validator

/*cors for cross-orgin request*/
const cors = require("cors");
app.use(cors());
app.use(comp());
app.use(helmet());

/*post request code*/
const bodyParser = require("body-parser"); //body parser for req.body
app.use(bodyParser.urlencoded()); //to make req.body not undefined
app.use(express.json());
/*pug-viewEngine*/
app.use(express.static("public"));

/*mongoe data-base*/
const mongoose = require("mongoose"); //to include mongoose data base
const { MongoServerSelectionError } = require("mongodb");
mongoose.connect("mongodb://localhost/BooksStore"); // to make data base if not found
const db = mongoose.connection; // to make object

db.on("error", (err) => {
  console.log(err);
}); //to check error

db.on("open", () => {
  console.log("DataBase is Running ...");
  app.listen(3000, () => {
    console.log("Server is Running ...");
  });
});
/*book*/
const bookSchema = new mongoose.Schema({
  URRL: String,
  title: String,
  authorName: String,
  amount: String,
  price: String,
  //<button>
});
const Book = mongoose.model("Book", bookSchema);

/*users database*/
const userSchema = new mongoose.Schema({
  username: { type: String },
  password: String,
  cart: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      counter: Number,
    },
  ],
  //so i can use populate()
});
const User = mongoose.model("User", userSchema);

/*validation*/

//login validation
/*
const array = [
  body("username")
    .not()
    .isEmpty()
    .withMessage("Username should not be Empty")
    .trim()
    .escape()
    .custom((value, { req }) => {
      if (value == "Admin") {
        return true;
      } else {
        throw Error("not Admin");
      }
    }),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password should not be Empty")
    .trim()
    .escape()
    .custom((value, { req }) => {
      if (value == "123") {
        return true;
      } else {
        throw Error("not Admin");
      }
    }),
];

const handler = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    next(err);
  }
  next();
};
*/
//add validation
/*
const array2 = [
  body("URRL").not().isEmpty().withMessage("URL Should Not Be Empty").trim(),
  body("title")
    .not()
    .isEmpty()
    .withMessage("title Should Not Be Empty")
    .trim()
    .escape(),
  body("authorName")
    .not()
    .isEmpty()
    .withMessage("authorName Should Not Be Empty")
    .trim()
    .escape(),
  body("amount")
    .not()
    .isEmpty()
    .withMessage("amount Should Not Be Empty")
    .isNumeric()
    .trim()
    .escape(),
  body("price")
    .not()
    .isEmpty()
    .withMessage("price Should Not Be Empty")
    .isNumeric()
    .trim()
    .escape(),
];

const handler2 = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    next(err);
  }
  next();
};*/

//users
/*
const array3 = [
  body("user-username")
    .not()
    .isEmpty()
    .withMessage("user-Username should not be Empty")
    .isEmail()
    .trim()
    .escape(),
  body("user-password")
    .not()
    .isEmpty()
    .withMessage("user-Password should not be Empty")
    .trim()
    .escape(),
];

const handler3 = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    next(err);
  }
  next();
};
*/

/**********************************************************Server Code************************************************************/

/*1-login:*/
//login as admin
//app.get("/", (req, res) => {});
app.get("/get-books", (req, res) => {
  Book.find({}, (err, books) => {
    res.send(books);
  });
});

/*2-admin:*/
//admin authorized
app.post("/admin", (req, res) => {
  //console.log("please admin run");
  const { username, password } = req.body;
  //console.log(req.body);
  if (username == "Admin" && password == "123") {
    res.send({ isAdmin: true });
  } //send to front end
  else {
    res.send({ isAdmin: false }); //send to front end
  }
});
//admin add book
app.post("/add-book", (req, res) => {
  const { URRL, authorName, title, price, amount } = req.body;
  //console.log("we get it from frontend");
  const newBook = new Book({
    URRL,
    authorName,
    title,
    price,
    amount,
  });
  newBook.save((err, result) => {
    if (err) {
      console.log(err);
    }
    Book.find({}, (err, books) => {
      res.send(books);
    });
  });
});

/*3-user*/
//login as user
app.post("/user", (req, res) => {
  //console.log("hi i'm User");
  const { username, password } = req.body;
  const newUser = new User({
    username,
    password,
  });
  newUser.save((err, result) => {
    if (err) {
      console.log(err);
    }
    res.send(newUser); //to send id of user to front end
  });
});

//add book
app.post("/addCartBook", (req, res) => {
  //console.log("hi book added");
  const { bookId, userId } = req.body; //bookID
  User.findById(userId, (err, user) => {
    const newCart = { _id: bookId, counter: 1 };
    const index = user.cart.findIndex((book) => {
      return bookId == book._id;
    });
    Book.findById(bookId, (err, mybook) => {
      if (err) {
        console.log(err);
      }
      mybook.amount = mybook.amount * 1 - 1;
      //handle if amount is equal to zero
      // if (mybook.amount == 0){

      // }
      mybook.save((err, result) => {
        if (err) {
          console.log(err);
        }
        if (index == -1) {
          user.cart.push(newCart);
        } else {
          user.cart[index].counter = user.cart[index].counter * 1 + 1;
        }
        user.save((err, result) => {
          if (err) {
            console.log(err);
          }
          // res.send(user);
          //console.log(result);
          User.populate(result, { path: "cart._id" }, (err, user) => {
            //console.log(user);
            user.password = undefined;
            Book.find({}, (err, books) => {
              let sum = 0;
              for (let i = 0; i < user.cart.length; i++) {
                sum = sum + user.cart[i]._id.price * user.cart[i].counter;
              }
              const userAndBookS = { user, books, sum };
              res.send(userAndBookS); //user but cart is populated
            });
          });
        });
      });
    });
  });
});
//delete book
app.post("/removeCartBook", (req, res) => {
  const { bookId, userId } = req.body;
  //console.log("hello please print");
  User.findById(userId, (err, user) => {
    const index = user.cart.findIndex((book) => {
      return bookId == book._id;
    });
    Book.findById(bookId, (err, mybook) => {
      if (err) {
        console.log(err);
      }
      if (index != -1) {
        user.cart[index].counter = user.cart[index].counter * 1 - 1;
        mybook.amount = mybook.amount * 1 + 1;
        if (user.cart[index].counter == 0) {
          user.cart.splice(index, 1);
        }
      }
      mybook.save((err, result) => {
        if (err) {
          console.log(err);
        }
        Book.find({}, (er, books) => {
          user.save((err, user) => {
            if (err) console.log(err);
            User.populate(user, { path: "cart._id" }, (err, user) => {
              user.password = undefined;
              let sum = 0;
              for (let i = 0; i < user.cart.length; i++) {
                sum = sum + user.cart[i]._id.price * user.cart[i].counter;
              }
              const userAndBookS = { user, books, sum };
              res.send(userAndBookS);
            });
          });
        });
      });
    });
  });
});

//delete book
app.post("/delete", (req, res) => {
  //console.log("please help");
  const { _id } = req.body; //if dev is clicked delete it
  Book.findByIdAndDelete(_id, (err, book) => {
    if (err) {
      console.log(err);
    }
  });
  Book.find({}, (err, books) => {
    res.send(books);
  });
});

/*4-error handling*/
app.get((error, req, res, next) => {
  res.send(`
    <h1>Error</h1>
    <h1>Please Check the following list</h1>
    <ul>
        <h1>Check that username is Typed as Admin</h1>
        <h1>Check that password is Typed as 123</h1>
        <h1>Check that you Entered a right BookInfo when you add the book</h1>
        <h2>BookInfo: no empty data in all texts and price should not be less than zero</h2>
    </ul>
    `);
});
