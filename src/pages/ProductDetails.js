import React from "react";
import firebase from "firebase";
import { withRouter } from "react-router-dom";

const vader = require("vader-sentiment");
const currentTimestamp = Date.now();
const mql = window.matchMedia("screen and (max-width: 576px)");
let reviewPositivity;

class ProductDetails extends React.Component {
  state = {
    buyerEmail: "",
    buyerName: "",
    buyingStatus: "",
    price: null,
    farmerName: "",
    farmerEmail: "",
    crop: "",
    quantity_kg: null,
    cropCategory: "",
    buyBtnStyle: "display-none",
    buyBtnContent: "",
    review: "",
    reviewFormStyle: "display-none",
    productID: "",
    reviewTop: [],
    reviewPositivity: "Calculating the",
    pageStyle: "",
    bidStatus: "",
    userName: "",
    userEmail: "",
    userPh: "",
    loadingStateStyle: "display-block text-center",
    productStateStyle: "display-none",
    purchaseMethod: "",
    purchaseMethodStyle: "display-none",
  };

  componentDidMount() {
    this.pageStyle(mql);
    mql.addEventListener("change", this.pageStyle);

    let productId = this.props.match.params.id;
    this.setState({ productID: productId });
    firebase
      .database()
      .ref("product/" + productId)
      .on("value", (doc) => {
        this.setState({
          price: doc.val().price,
          farmerName: doc.val().farmerName,
          farmerEmail: doc.val().farmerEmail,
          crop: doc.val().crop,
          quantity_kg: doc.val().quantity_kg,
          productStateStyle: "display-block row",
          loadingStateStyle: "display-none",
        });
        document.title = `${doc.val().crop}`;
        if (doc.val().quantity_kg < 15) {
          this.setState({
            cropCategory: "Price fixed at",
            buyBtnContent: "Add to cart",
          });
          if (doc.val().buyerName) {
            if (doc.val().buyerEmail === this.state.userEmail) {
              let timeObj = new Date(doc.val().purchaseTime);
              this.setState({
                buyingStatus: `You bought ${
                  doc.val().crop
                } on ${timeObj.toLocaleDateString()} at ${timeObj.toLocaleTimeString()}`,
                reviewFormStyle: "display-block",
                buyBtnStyle: "display-none",
              });
              if (document.getElementById("product-brought-alert")) {
                document
                  .getElementById("product-bought-alert")
                  .classList.remove("display-none");
              }
            }
            if (doc.val().review) {
              this.setState({ reviewFormStyle: "display-none" });
            }
            this.setState({
              buyerEmail: doc.val().buyerEmail,
              buyerName: doc.val().buyerName,
            });
          }
        } else {
          if (doc.val().buyerName) {
            this.setState({
              cropCategory: "Current bid at",
              buyingStatus: (
                <span>
                  <strong>Current bid by</strong> {doc.val().buyerName}
                </span>
              ),
              buyerEmail: doc.val().buyerEmail,
              buyerName: doc.val().buyerName,
              buyBtnStyle: "display-block customBtn",
            });
            if (doc.val().bidEnds < currentTimestamp) {
              this.setState({
                buyingStatus: (
                  <span>
                    <strong>Bought by:</strong> {doc.val().buyerName}
                  </span>
                ),
                buyBtnStyle: "display-none",
              });
              if (doc.val().buyerEmail === this.state.userEmail) {
                if (document.getElementById("product-bought-alert")) {
                  document
                    .getElementById("product-bought-alert")
                    .classList.remove("display-none");
                }
              }
            }
          } else {
            this.setState({
              cropCategory: <strong>Bid starts at</strong>,
            });
          }
        }
      });
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          userEmail: user.email,
          userName: user.displayName,
        });
        firebase
          .database()
          .ref("user/")
          .once("value")
          .then((snapshot) => {
            let userdb = [];
            if (snapshot.exists()) {
              snapshot.forEach((doc) => {
                userdb = userdb.concat(doc.val());
              });
              for (let u of userdb) {
                if (u.category === "farmer" && u.email === user.email) {
                  this.setState({ buyBtnStyle: "display-none" });
                  break;
                }
                if (u.category === "consumer" && u.email === user.email) {
                  firebase
                    .database()
                    .ref("product/" + this.state.productID)
                    .once("value")
                    .then((productSnapshot) => {
                      if (!(productSnapshot.val().buyerEmail === user.email)) {
                        if (!productSnapshot.val().buyerEmail) {
                          this.setState({
                            buyBtnStyle: "display-block customBtn",
                            userPh: u.phNo,
                          });
                        }
                      }
                    });
                  if (u.cart) {
                    let cartItemKeys = Object.keys(u.cart);
                    for (let cartItemKey of cartItemKeys) {
                      if (
                        u.cart[cartItemKey].productID === this.state.productID
                      ) {
                        this.setState({
                          buyBtnStyle: "display-none",
                        });
                        document
                          .getElementById("product-alert")
                          .classList.remove("display-none");
                        break;
                      }
                    }
                  }
                  break;
                }
              }
            }
          });
      }
    });

    firebase
      .database()
      .ref("product/" + productId)
      .on("value", (productSnapshot) => {
        if (productSnapshot.val().quantity_kg >= 15) {
          if (productSnapshot.val().buyerName) {
            if (productSnapshot.val().bidEnds >= currentTimestamp) {
              if (this.state.userEmail === productSnapshot.val().buyerEmail) {
                this.setState({
                  buyBtnContent: "",
                  buyBtnStyle: "display-none",
                });
                if (document.getElementById("product-bid-alert")) {
                  document
                    .getElementById("product-bid-alert")
                    .classList.remove("display-none");
                }
              } else {
                document.querySelector("#btn").disabled = false;
                let cropPrice = productSnapshot.val().price + 10;
                let btnContent = `Bid Rs. ${cropPrice}/Kg`;
                this.setState({
                  buyBtnContent: btnContent,
                  price: cropPrice,
                });
              }
              this.setState({
                bidStatus: (
                  <span>
                    <strong>Bid ends at</strong>{" "}
                    {new Date(productSnapshot.val().bidEnds).toLocaleString()}
                  </span>
                ),
              });
            } else {
              document.querySelector("#btn").disabled = true;
              this.setState({
                bidStatus: (
                  <span>
                    <strong>Bid ended at</strong>{" "}
                    {new Date(productSnapshot.val().bidEnds).toLocaleString()}
                  </span>
                ),
              });
              if (productSnapshot.val().buyerEmail === this.state.userEmail) {
                if (!productSnapshot.val().review) {
                  this.setState({
                    reviewFormStyle: "display-block",
                  });
                }
                if (!productSnapshot.val().purchaseMethod) {
                  this.setState({
                    purchaseMethodStyle: "display-block",
                  });
                }
              }
            }
          }
          if (!productSnapshot.val().bidEnds) {
            this.setState({
              buyBtnContent: `Bid Rs. ${productSnapshot.val().price}/Kg`,
            });
          }
        }
      });
  }

  componentWillUnmount() {
    firebase.database().ref("product/").off();
    firebase.database().ref("product/").off();
    firebase.database().ref("user/").off();
    firebase.database().ref("user/").off();
    mql.removeEventListener("change", this.pageStyle);
  }

  render() {
    let reviewString = "";
    let review = [];
    let intensity;
    firebase
      .database()
      .ref("product")
      .on("value", (snapshot) => {
        snapshot.forEach((doc) => {
          if (this.state.farmerEmail === doc.val().farmerEmail) {
            if (doc.val().review) {
              reviewString += doc.val().review;
              if (review.length <= 3) {
                review.push({
                  buyerName: doc.val().buyerName,
                  buyerReview: doc.val().review,
                });
              }
            }
          }
        });
        if (reviewString) {
          intensity =
            vader.SentimentIntensityAnalyzer.polarity_scores(reviewString);
          reviewPositivity = (intensity.pos * 100).toFixed(2);
        }
      });
    return (
      <div
        id="product-details"
        className={this.state.pageStyle}
        style={{ fontSize: "1.25em" }}
      >
        <div id="product-alert" className="display-none">
          <div id="highlight" className="alert alert-success" role="alert">
            <i className="fas fa-check"></i> {this.state.crop} was added to your
            cart
          </div>
        </div>
        <div id="product-bought-alert" className="display-none">
          <div id="highlight" className="alert alert-success" role="alert">
            <i className="fas fa-check"></i> Your order for {this.state.crop}{" "}
            was completed.
          </div>
        </div>
        <div id="product-bid-alert" className="display-none">
          <div id="highlight" className="alert alert-success" role="alert">
            <i className="fas fa-check"></i> Your bid for {this.state.crop} was
            placed.
          </div>
        </div>
        <div className={this.state.productStateStyle}>
          <div id="info" className="col-md-6">
            <h1 id="highlight">{this.state.crop}</h1>
            <p>
              <strong>Sold by</strong> {this.state.farmerName}
            </p>
            <p>
              <strong>Quantity:</strong> {this.state.quantity_kg} Kg
            </p>
            <p>
              <strong>{this.state.cropCategory}</strong> &#8377;{" "}
              {this.state.price}/Kg
            </p>
            <p>{this.state.bidStatus}</p>
            <p>{this.state.buyingStatus}</p>
            <p>
              <strong>
                {reviewPositivity ? reviewPositivity : "Insufficient data for"}{" "}
                %
              </strong>{" "}
              positive reviews
            </p>
            <button
              id="btn"
              className={this.state.buyBtnStyle}
              style={{ borderRadius: "14px" }}
              onClick={this.onBuyCrop}
            >
              {this.state.buyBtnContent}
            </button>
          </div>
          <div id="info" className="col-md-6">
            <h1 className="content" id="highlight">
              Top reviews about {this.state.farmerName}'s products
            </h1>
            {review.length ? (
              review.map((rev, pos) => {
                return (
                  <div key={pos}>
                    <p>
                      <strong>
                        {rev.buyerName ? rev.buyerName : "A user"}
                      </strong>{" "}
                      says "{rev.buyerReview}"
                    </p>
                    <hr />
                    <br />
                  </div>
                );
              })
            ) : (
              <p className="content">Sorry, we couldn't find any reviews...</p>
            )}
          </div>
        </div>
        <div
          id="info"
          className={this.state.reviewFormStyle}
          style={{ marginTop: "5%", padding: "1%" }}
        >
          <h1 id="highlight">
            Please leave a review for {this.state.farmerName}!
          </h1>
          <form onSubmit={this.onReviewSubmit}>
            <textarea
              style={{ width: "100%", height: "auto" }}
              value={this.state.review}
              onChange={this.handleReviewChange}
              placeholder="example: Fresh quality"
            ></textarea>
            <br />
            <br />
            <input type="submit" className="customBtn" />
          </form>
        </div>
        <div id="info" className={this.state.loadingStateStyle}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h3>Loading, please wait...</h3>
        </div>
        <div id="info" className={this.state.purchaseMethodStyle}>
          <h1 id="highlight">Please select your purchase method</h1>
          <div onChange={this.handlePurchase}>
            <input name="purchase" type="radio" value="delivery" /> Home
            Delivery
            <br />
            <input name="purchase" type="radio" value="pickup" /> Pick up at
            Farmer's place
          </div>
          <button
            className="customBtn"
            style={{ borderRadius: "10px", margin: "10px" }}
            onClick={this.onPurchaseMethodSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  onBuyCrop = () => {
    if (this.state.buyBtnContent === "Add to cart") {
      let userDbObj = firebase.database().ref("user/" + this.state.userPh);
      let cartObj = userDbObj.child("cart");
      let productExists = false;
      let productFlag = true;
      cartObj.get().then((cartObjSnapshot) => {
        cartObjSnapshot.forEach((cartObjSnap) => {
          if (
            productFlag &&
            cartObjSnap.val().productID === this.state.productID
          ) {
            productExists = true;
            productFlag = false;
          }
        });
        if (productExists) {
          alert(
            `${this.state.crop} sold by ${this.state.farmerName} already exists in your cart.`
          );
        } else {
          let cartItem = cartObj.push();
          cartItem.update({
            crop: this.state.crop,
            price: this.state.price,
            productID: this.state.productID,
          });
          alert("Added to cart.");
        }
        this.setState({
          buyBtnContent: (
            <div>
              <i className="fas fa-check"></i> Added to cart
            </div>
          ),
        });
        document.getElementById("btn").disabled = true;
      });
    }

    if (document.getElementById("btn").textContent.includes("Bid")) {
      let currentTime = Date.now();
      let bidShouldEnd = currentTime + 3600000;
      firebase
        .database()
        .ref("product/" + this.props.match.params.id)
        .update({
          price: this.state.price,
          buyerEmail: this.state.userEmail,
          buyerName: this.state.userName,
          bidEnds: bidShouldEnd,
        });
      this.setState({
        buyBtnContent: (
          <div>
            <i className="fas fa-check"></i> Bid of &#8377; {this.state.price}{" "}
            placed
          </div>
        ),
      });
      if (reviewPositivity) {
        firebase
          .database()
          .ref("user/")
          .on("value", (userSnapshot) => {
            userSnapshot.forEach((user) => {
              if (user.email === this.state.farmerEmail) {
                firebase
                  .database()
                  .ref("user/" + user.phNo)
                  .update({
                    percentPositiveReview: reviewPositivity,
                  });
              }
            });
          });
      }
      alert(
        `Your bid for ${this.state.crop} was placed at Rs. ${this.state.price}`
      );
      window.location.reload();
    }
  };

  onReviewSubmit = (e) => {
    e.preventDefault();
    firebase
      .database()
      .ref("product/" + this.state.productID)
      .update({
        review: this.state.review,
      });
    if (this.state.review) {
      alert(
        "Thank you for adding a review..!\nWe hope you enjoyed shopping with Krishak!"
      );
    }
    this.props.history.push("/home");
  };

  handleReviewChange = (e) => {
    this.setState({
      review: e.target.value,
    });
  };

  pageStyle = (e) => {
    const btn = document.getElementById("btn");
    if (btn) {
      if (e.matches) {
        this.setState({ pageStyle: "content" });
        btn.classList.add("content");
      } else {
        this.setState({ pageStyle: "" });
        btn.classList.remove("content");
      }
    }
  };

  handlePurchase = (e) => {
    this.setState({ purchaseMethod: e.target.value });
  };

  onPurchaseMethodSubmit = () => {
    this.setState({
      purchaseMethodStyle: "display-none",
    });
    firebase
      .database()
      .ref("product/" + this.state.productID)
      .update(
        {
          purchaseMethod: this.state.purchaseMethod,
        },
        (error) => {
          if (error) {
            alert(`Oops, there was an error\n${error}`);
          } else {
            alert(
              "Your purchase method was accepted.\nYou may check your purchase history in your profile.\nThank you for shopping with us! 😇"
            );
            this.props.history.push("/user-profile");
          }
        }
      );
  };
}

export default withRouter(ProductDetails);
