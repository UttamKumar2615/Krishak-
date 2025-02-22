import React from "react";
import firebase from "firebase";
import { Link, withRouter } from "react-router-dom";
import ProductItem from "./ProductItem";
const vader = require("vader-sentiment");
const mql = window.matchMedia("screen and (max-width: 576px)");
class Home extends React.Component {
  state = {
    loggedInUser: "",
    loggedInUserCategory: "",
    loginStyle: "",
    logoutStyle: "",
    products: [],
    searchQuery: "",
    searchProgress: "",
    isLoading: true,
    heroContentStyle: "col-sm-6",
    cropsContent: (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3>Checking your warehouse..</h3>
      </div>
    ),
  };

  componentDidMount() {
    document.title = "Krishak";
    this.formStyle(mql);
    mql.addEventListener("change", this.formStyle);

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          loggedInUser: user.displayName,
          loginStyle: "display-none",
          logoutStyle: "display-block row",
        });
        firebase
          .database()
          .ref("user/")
          .on("value", (snapshot) => {
            let userdb = [];
            snapshot.forEach((doc) => {
              userdb = userdb.concat(doc.val());
            });
            for (let u of userdb) {
              if (u.category === "farmer" && u.email === user.email) {
                this.setState({
                  loggedInUserCategory: "farmer",
                  isLoading: false,
                });
                let cropdb = [];
                let userEmail = "";
                let userCrops = [];
                firebase
                  .database()
                  .ref("product")
                  .on("value", (snapshot) => {
                    snapshot.forEach((doc) => {
                      cropdb = cropdb.concat(doc);
                    });
                    firebase.auth().onAuthStateChanged((user) => {
                      if (user) {
                        userEmail = user.email;
                        for (let crop of cropdb) {
                          if (userEmail === crop.val().farmerEmail) {
                            userCrops = userCrops.concat(crop);
                          }
                        }
                      }
                      if (userCrops.length) {
                        this.setState({
                          cropsContent: (
                            <div id="info">
                              <h2>Your Crops:</h2>
                              {userCrops.map((product, pos) => {
                                return (
                                  <ProductItem product={product} key={pos} />
                                );
                              })}
                            </div>
                          ),
                        });
                      } else {
                        this.setState({
                          cropsContent: (
                            <div className="row">
                              <div className="col-sm-3"></div>
                              <div className="col-sm-6">
                                <h3>
                                  Welcome back to Krishak!
                                  <br />
                                  Your products appear here!
                                </h3>
                                <img
                                  style={{ width: "75%", height: "auto" }}
                                  src="./images/farmer-crop-upload.svg"
                                  alt="Delivery boy here to deliver your order."
                                />
                              </div>
                              <div className="col-sm-3"></div>
                            </div>
                          ),
                        });
                      }
                    });
                  });
                break;
              }
              if (u.category === "consumer" && u.email === user.email) {
                this.setState({
                  loggedInUserCategory: "consumer",
                  isLoading: false,
                });
                if (this.state.searchQuery) {
                  this.setState({
                    searchProgress: (
                      <div className="text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <h3>Let us check the stockroom..</h3>
                      </div>
                    ),
                  });
                } else {
                  this.setState({
                    searchProgress: (
                      <div className="row">
                        <div className="col-sm-3"></div>
                        <div className="col-sm-6">
                          <h3>
                            Hey there!
                            <br />
                            What are you looking for..?
                            <br />
                            Please let us know via that search bar..
                          </h3>
                          <img
                            className="heroImg"
                            src="./images/searchquerynull.svg"
                            alt="Delivery boy here to deliver your order."
                          />
                        </div>
                        <div className="col-sm-3"></div>
                      </div>
                    ),
                  });
                }
                break;
              }
            }
          });
      } else {
        this.setState({
          loginStyle: "display-block row heroSection",
          logoutStyle: "display-none",
          isLoading: false,
        });
      }
    });
  }

  componentWillUnmount() {
    firebase.database().ref("product").off();
    firebase.database().ref("product").off();
    firebase.database().ref("product/").off();
    firebase.database().ref("user/").off();
    firebase.database().ref("user").off();
    mql.removeEventListener("change", this.formStyle);
  }

  render() {
    let displayContent = null;
    if (this.state.isLoading) {
      displayContent = (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h3>Please wait while the mart opens up for you!</h3>
        </div>
      );
    } else {
      if (this.state.loggedInUserCategory === "consumer") {
        displayContent = (
          <div>
            <div className={this.state.loginStyle}>
              <div className={this.state.heroContentStyle}>
                <h3 id="highlight" className="heroTitle">
                  Direct From Farm
                </h3>
                <div id="info">
                  <p className="heroText">
                    Providing you fresh, and organic vegetables.. Straight from
                    the farm!
                  </p>
                  <button className="customBtn" onClick={this.onSignup}>
                    Login
                  </button>
                  <br />
                  <br />
                  <button
                    className="customBtnSecondary"
                    onClick={this.onSignup}
                  >
                    Register
                  </button>
                </div>
              </div>
              <div className="col-sm-6">
                <img
                  className="heroImg"
                  src="./images/farmerlandingpage.svg"
                  alt="Farmer with a hen in his hand, smiling."
                />
              </div>
            </div>
            <div className={this.state.logoutStyle}>
              <div id="info" className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for groceries.."
                  aria-label="Search for veggies.."
                  aria-describedby="button-addon2"
                  onChange={this.onSearchQueryChange}
                  value={this.state.searchQuery}
                />
                <button
                  className="btn btn-outline-success"
                  type="button"
                  id="button-addon2"
                  onClick={this.productSearch}
                >
                  Search
                </button>
              </div>
              <div id="info">
                <h3 id="highlight">Results for '{this.state.searchQuery}'</h3>
                <br />
                <div id="highlight" className="content container">
                  {this.state.searchProgress}
                </div>
                {this.state.products.map((product, pos) => {
                  return <ProductItem product={product} key={pos} />;
                })}
              </div>
            </div>
          </div>
        );
      } else {
        displayContent = (
          <div>
            <div className={this.state.loginStyle}>
              <div className={this.state.heroContentStyle}>
                <h3 id="highlight" className="heroTitle">
                  Direct From Farm
                </h3>
                <div id="info">
                  <p className="heroText">
                    Providing you fresh, and organic vegetables.. Straight from
                    the farm!
                  </p>
                  <button className="customBtn" onClick={this.onSignup}>
                    Login
                  </button>
                  <br />
                  <br />
                  <button
                    className="customBtnSecondary"
                    onClick={this.onSignup}
                  >
                    Register
                  </button>
                </div>
              </div>
              <div className="col-sm-6">
                <img
                  className="heroImg"
                  src="./images/farmerlandingpage.svg"
                  alt="Farmer with a hen in his hand, smiling."
                />
              </div>
            </div>
            <div className={this.state.logoutStyle}>
              <button
                className="btn btn-outline-success"
                type="button"
                style={{ width: "75%", margin: "10px auto" }}
                onClick={this.onAddCrop}
              >
                Add Crop
              </button>
              <br />
              <div id="highlight" className="container">
                {this.state.cropsContent}
              </div>
            </div>
          </div>
        );
      }
    }
    return displayContent;
  }

  onAddCrop = () => {
    this.props.history.push("/add-crop");
  };

  formStyle = (e) => {
    if (e.matches) {
      this.setState({
        heroContentStyle: "col-sm-6 content",
      });
      console.log();
    } else {
      this.setState({
        heroContentStyle: "col-sm-6",
      });
    }
  };

  productSearch = () => {
    let resultKey = [];
    let previousProductsData = "";
    while (this.state.products.length) {
      previousProductsData = this.state.products.pop();
    }
    if (this.state.searchQuery) {
      firebase
        .database()
        .ref("product/")
        .on("value", (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if (!(doc.val().quantity_kg < 15 && doc.val().buyerEmail)) {
              resultKey = resultKey.concat(doc);
              let farmer = doc.val().farmerEmail;
              let reviewRaw;
              let reviewPos;
              let farmerObj;
              let breakFlag = true;
              firebase
                .database()
                .ref("product")
                .on("value", (snapshot) => {
                  snapshot.forEach((s) => {
                    if (farmer === s.val().farmerEmail) {
                      if (s.val().review) {
                        reviewRaw += s.val().review;
                      }
                    }
                  });
                  if (reviewRaw) {
                    reviewPos =
                      vader.SentimentIntensityAnalyzer.polarity_scores(
                        reviewRaw
                      );
                    reviewPos = reviewPos.pos * 100;
                    firebase
                      .database()
                      .ref("user/")
                      .on("value", (userSnapshot) => {
                        userSnapshot.forEach((user) => {
                          if (breakFlag && farmer === user.val().email) {
                            farmerObj = user.val();
                            breakFlag = false;
                          }
                        });
                        if (reviewPos) {
                          firebase
                            .database()
                            .ref("user/" + farmerObj.phNo)
                            .update({
                              percentPositiveReview: reviewPos,
                            });
                        }
                      });
                  }
                });
            }
          });
          let queryData = [];
          for (let snap of resultKey) {
            if (snap) {
              let snapData = snap.val().crop.toLowerCase();
              if (snapData.includes(this.state.searchQuery)) {
                queryData = queryData.concat(snap);
              }
            }
          }
          this.setState({ products: queryData });
          if (queryData.length) {
            this.setState({ searchProgress: "" });
          } else {
            this.setState({
              searchProgress: (
                <div className="row">
                  <div className="col-sm-3"></div>
                  <div className="col-sm-6">
                    <h3>
                      Oops!
                      <br />
                      Seems like we're out of stock with{" "}
                      {this.state.searchQuery}
                    </h3>
                    <img
                      className="heroImg"
                      src="./images/farmercropsnotfound.svg"
                      alt="Delivery boy here to deliver your order."
                    />
                  </div>
                  <div className="col-sm-3"></div>
                </div>
              ),
            });
          }
        });
      if (!this.state.products.length && !this.state.searchQuery) {
        this.setState({
          searchProgress: (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3>Let us check the stockroom..</h3>
            </div>
          ),
        });
      }
    } else {
      this.setState({
        searchProgress: (
          <div className="row">
            <div className="col-sm-3"></div>
            <div className="col-sm-6">
              <h4>
                Please provide an input..
                <br />
                Check your groceries, and see what's missing..
                <br />
                We're here to help!😇
              </h4>
              <img
                className="heroImg"
                src="./images/farmercropsnotfound.svg"
                alt="Delivery boy here to deliver your order."
              />
            </div>
            <div className="col-sm-3"></div>
          </div>
        ),
      });
    }
  };

  onSearchQueryChange = (event) => {
    this.setState({ searchQuery: event.target.value.toLowerCase() });
  };

  onSignup = () => {
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        let user = result.user;
        let userFlag = true;
        let userFound = false;
        firebase
          .database()
          .ref("user/")
          .on("value", (userSnapshot) => {
            userSnapshot.forEach((userSnap) => {
              if (userFlag && userSnap.val().email === user.email) {
                userFlag = false;
                userFound = true;
              }
            });
            if (!userFound) {
              alert(
                `Dear ${user.displayName}, let's first set up your profile!`
              );
              this.props.history.push("/update-profile");
            }
          });
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;

        alert(`${errorCode}\n${errorMessage}`);
      });
  };
}
export default withRouter(Home);
