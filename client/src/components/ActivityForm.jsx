import React, { Component } from 'react';
import '../styles/ActivityForm.css';

import LocationInput from './LocationInput';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

class ActivityForm extends Component{
  constructor(props){
    // props will need to have userId and activity id
    super(props);
    this.state = {
      apiLoaded: false,
      activityName: "",
      location: "",
      totalMinutes: "",
      month: "",
      notes: ""
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.deleteActivity = this.deleteActivity.bind(this);
  }

  // ------ LIFE CYCLE ------
  componentDidMount(){
    this.getActivity(this.props.activityId);
  }

  // changed from componentWillReceiveProps
  componentDidUpdate(prevProps){
    if(prevProps.activityId !== this.props.activityId){
      if(this.props.activityId === 0){
        this.setState({
          totalMinutes: "",
          activityName: "",
          month: "",
          notes: ""
        })
      } else {
        this.getActivity(this.props.activityId);
      }
    }
  }
  // ------ END LIFE CYCLE ------

  // ------ FETCHING ------
  getActivity(id){
    // if activity is 0 then we are trying to create a new activity
    if(id !== 0){
      fetch(`http://localhost:8080/activities/${id}`, {
        method: 'GET'
      }).then(res => res.json())
      .then(json => {
        this.setState({
          activityName: json.activityName,
          totalMinutes: json.totalMinutes, // we may need to be careful of types here
          notes: json.notes,
          apiLoaded: true
        })
      }).catch(err => console.log(err))
    } else {
      this.setState({
        apiLoaded: true
      })
    }
  }

  //after patching activity, update in top state
  patchActivity(id){
    fetch(`http://localhost:8080/activities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityName: this.state.activityName,
        totalMinutes: this.state.totalMinutes,
        notes: this.state.notes
      })
    }).then(res => res.json())
    .then(json => {
      this.props.editActivity(json);
    }).catch(err => console.log(err))
  }

  // after posting, add to top state arrays
  postActivity(){
    fetch("http://localhost:8080/activities", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityName: this.state.activityName || "default",
        userId: this.props.userId,
        month: this.state.month || "month",
        totalMinutes: this.state.totalMinutes || 0,
        notes: this.state.notes
      })
    }).then(res => res.json())
    .then(json => {
      this.props.addActivity(json);
    }).catch(err => console.log("error:", err))
  }

  deleteActivity(){
    fetch(`http://localhost:8080/activities/${this.props.activityId}`, {
      method: 'DELETE'
    }).then(res => res.json())
    .then(json => {
      this.props.deleteActivity(this.props.activityId);
    }).catch(err => console.log(err))
  }

  // ------ END FETCHING ------
  
  // ----- GOOGLE API -----
  // 1. when a user submits an activity, check to see if the location is real,
  //     if it is, submit with lat lng coordinates and name
  //     if not then display a red x next to the input?
  // check format for patching and posting methods
  // 2. when an activity is selected put the location name into field
  //     

  // ----- END GOOGLE -----

  // ------ FORM HANDLERS ------
  handleInputChange(event){
    const name = event.target.name
    const value = event.target.value
    this.setState({
      [name]:value,
    })
  }

  // need to send put request with userId as well 
  handleSubmit(event){
    event.preventDefault();
    const activityId = this.props.activityId;

    // check if location is valid and then submit with lat and lng
    const GOOGLE_PLACE_URL = "https://maps.googleapis.com/maps/api/place/textsearch/js?query=" +
      this.state.location + "&key=" + API_KEY;
      
    fetch(GOOGLE_PLACE_URL, {
      method: "GET"
    }).then(res => res.json())
    .then(json => {
      if(json.status === "OK"){
        // grabs location from first result
        const lat = json.results[0].geometry.location.lat
        const lng = json.results[0].geometry.location.lng
        console.log(lat, lng);

        //post new or patch selected activity
        if(this.props.activityId === 0){
          // post new
          this.postActivity();
        } else {
          // patch it
          this.patchActivity(activityId);      
        }
      } else {
        // show the user some warning that google didn't find location
      }
    }).catch(err => console.log(err))
  }
  // ------ END FORM HANLDERS ------

  render(){
    return(
      <div className="activity-form-container">
        <h2>{this.props.activityId !== 0? 'Edit ' : 'Create '}Activity</h2>
        {this.state.apiLoaded && (
          <div className="form-wrapper">
            <form onSubmit={this.handleSubmit}>

              <input name="activityName" onChange={this.handleInputChange} type="text" 
                placeholder="Activity Name" value={this.state.activityName}
              />
              <br />

              {/* This will be location input tag 
              <input name="location" onChange={this.handleInputChange} type="text" 
                placeholder="Location" value={this.state.location}
              />
              */}
              <LocationInput />
              <br />

              {/* only show date input for a new activity */}
              {this.props.activityId === 0 && (
                <input name="month" onChange={this.handleInputChange} type="text" 
                  placeholder="Month" value={this.state.month}
                />
              )}
              {this.props.activityId === 0 && <br />}

              <input name="totalMinutes" onChange={this.handleInputChange} type="number"  
                placeholder="Total Minutes" value={this.state.totalMinutes}
              />
              <br />

              <input name="notes" onChange={this.handleInputChange} type="text"
                placeholder="Notes" value={this.state.notes}
              />
              <br />

              {/* only show save button if a user is selected */}
              {this.props.userId === 0 ? (
                <h3>Please select a user before submitting!</h3>
              ) : (
                <input type="submit" value="Save"/>
              )}

              {/* only show delete button if an activity is selected */}
              {this.props.activityId !== 0 && (
                <button id="delete" onClick={this.deleteActivity}>Delete</button>
              )}
              
            </form>
          </div>
          
        )}
      </div>
    )
  }
}

export default ActivityForm;