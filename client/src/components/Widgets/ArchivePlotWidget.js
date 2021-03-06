import React, { Component } from 'react';
import io from 'socket.io-client';
import moment from 'moment';
import {  Alert , Row, Col , Button , DatePicker} from 'antd';
import { utc2date , convertTimetoDate, mjd2cal} from './../Cosmos/Libs'
import PlotWidget from './PlotWidget'
import cosmosInfo from './../Cosmos/CosmosInfo'
import { LineChart, Line ,XAxis, YAxis, Tooltip, ResponsiveContainer, Label} from 'recharts';
const colors=["#82ca9d", "#9ca4ed","#f4a742","#e81d0b","#ed9ce6"]
const socket = io(cosmosInfo.socket);
const { RangePicker } = DatePicker;

class ArchivePlotWidget extends Component {
  constructor(props){
    super(props);
      this.state = {
        data:[],
        boundary:{
          start:null,
          end:null
        } ,
        date_start: null,
        date_end: null,
        show_plot:false

      };
  }
  componentWillMount() {
    // get date boundaries
    socket.emit('agent_dates', {agent: this.props.info.agent, node: this.props.info.node }, this.setBoundaries.bind(this));
  }
  setBoundaries(msg){
    if(msg.valid===true){
      var startDate = new Date(msg.dates.start)
      var endDate = new Date(msg.dates.end)
      var boundaries = this.state.boundary;
      boundaries.start=startDate;
      boundaries.end=endDate;
      this.setState({boundary:boundaries});
    }
  }
  onDateChange(dates, dateStrings){

    var startDate = dates[0].startOf('day');
    var endDate = dates[1].endOf('day');

    this.setState({date_start:startDate, date_end:endDate});

    socket.emit('agent_query',{agent: this.props.info.agent,
      node: this.props.info.node,
      startDate: startDate,
      endDate: endDate,
      fields:this.getQueryFields()},
      this.receivedPlotData.bind(this));

  }
  getQueryFields(){
    var vals = this.props.info.values.structure;
    var fields = [];
    var field;
    for(var i = 0; i < vals.length; i++){
      field = vals[i][0]
      for(var j=1; j < vals[i].length; j++){
        field+="."+vals[i][j];
      }
      fields.push(field)
    }
    console.log(fields)
    return fields;
  }
  receivedPlotData(data){
    if(data.length > 0 ){
      console.log(data.length, " entries ")
      this.setState({data:data})
    }else {
      console.log("didnt get anything")
    }

  }
  disabledDate(current) {
    return current && (current > moment(this.state.boundary.end).endOf('day') ||
      current < moment(this.state.boundary.start).startOf('day'));
  }


  render() {
    var selected_dates;
    if(this.state.date_start !== null){
      selected_dates = [moment(this.state.date_start), moment(this.state.date_end)]
    }
    var date_picker = <RangePicker
            disabledDate={this.disabledDate.bind(this)}
            value={selected_dates}
            onChange={this.onDateChange.bind(this)}
            format="YYYY-MM-DD"
          />
    return (
      <div>
        <Row gutter={16}>
          <Col span={16} >
          <PlotWidget info={this.props.info} plot_domain={['auto, auto']} data={this.state.data}/>
          </Col>
          <Col span={8} >
            {date_picker}
          </Col>
        </Row>
      </div>
    );


  }
}

export default ArchivePlotWidget;
