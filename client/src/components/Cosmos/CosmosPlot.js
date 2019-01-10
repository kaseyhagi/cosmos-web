import React, { Component } from 'react';
import io from 'socket.io-client';
import moment from 'moment';
import { Card, Switch, DatePicker, Slider, Row, Col, Button, Icon, Badge, Tooltip} from 'antd';
import cosmosInfo from './CosmosInfo'
import { mjd2cal } from './Libs'
import PlotBox from './PlotBox'
const socket = io(cosmosInfo.socket);
const colors=["#82ca9d", "#9ca4ed","#f4a742","#e81d0b","#ed9ce6"]
const { RangePicker } = DatePicker;

function parse_live_data(data,fields){
  var values = {};
  var p, val;
  values.utc=Number(data.agent_utc);
  values["date"]= mjd2cal(Number(data.agent_utc)).getTime()
  for(var i = 0; i < fields.label.length; i++){
    p = fields.structure[i];
    val = data;
    for(var j = 0; j <p.length; j++ ){
      val=val[p[j]];
    }

    values[fields.label[i]]=Number(val);
  }

  return values;
}
function convertTimetoDate(val){
  return new Date(val).toLocaleString('en-US')
}

class CosmosPlot extends Component {
/* Returns a select box filled with active agents */
  constructor(props){
    super(props);
      this.state = {
        live_view:this.props.info.live,
        data: [],
        live_data:[],
        live:{
          current_data:{},
          pause: false
        },
        archive: {
          date_boundaries:{
            start:null,
            end: null
          },
          date_picker:{
            start:null,
            end:null
          }
        },
        slider:{
          start:0,
          end:1,
          min:0,
          max:1
        }
      };
  }

    componentDidMount() {
      if(this.props.info.live){
        this.startListening();
      }
      if(this.props.info.archive){
        socket.emit('agent_dates', {agent: this.props.info.agent}, this.setBoundaries.bind(this));
      }

    }
    startListening(){
      socket.emit('start record', this.props.info.agent);
      socket.on('agent subscribe '+this.props.info.agent, (data) => { // subscribe to agent
        if (data) {

        var saved_data = this.state.live_data;
        var l = this.state.live;
        if(this.props.info.values.label.length>0){
          var data_entry = parse_live_data(data, this.props.info.values);
          if(saved_data.length > this.props.info.xRange){
            saved_data.shift();
          }
          saved_data = [...saved_data, data_entry]
          l.current_data = data_entry;
          this.setState({live_data:saved_data, live: l});
        }

        }

      });
    }
    setBoundaries(msg){
      var startDate = new Date(msg.dates.start)
      var endDate = new Date(msg.dates.end)
      // console.log(moment(startDate).format('lll')  , moment(endDate).format('lll')  );
      // console.log(moment(startDate).local(),moment(endDate).local())
      var a = this.state.archive;
      a.date_boundaries.start=startDate;
      a.date_boundaries.end=endDate
      if(msg.valid===true){
        this.setState({archive:a})
      }
    }

    componentDidUpdate(prevProps){
    }
    componentWillUnmount() {
      var prevState = this.props.info.agent;
      socket.removeAllListeners('agent subscribe '+prevState);
      socket.emit('end record', this.props.info.agent);
    }
    onChangeView(val){
      if(val ){
        if( this.state.live_data.length ===0){
          this.startListening();
        }
      }
      else if(this.state.archive.date_boundaries === null){
        socket.emit('agent_dates', {agent: this.props.info.agent}, this.setBoundaries.bind(this));
      }
      this.setState({live_view:val});
    }

    disabledDate(current) {
      return current && (current > moment(this.state.archive.date_boundaries.end).endOf('day') || current < moment(this.state.archive.date_boundaries.start).startOf('day'));
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
      return fields;
    }
    sliderChange(value){
      var slider= this.state.slider;
      slider.start=value[0];
      slider.end = value[1];
      // console.log(slider.start, slider.end)
      this.setState({slider:slider})
    }
    onDateChange(dates, dateStrings){

      var startDate = dates[0].startOf('day');
      var endDate = dates[1].endOf('day');
      var a = this.state.archive;
      a.date_picker.start = startDate;
      a.date_picker.end = endDate;
      this.setState({archive:a})

      socket.emit('agent_query',{agent: this.props.info.agent, startDate: startDate, endDate: endDate, fields:this.getQueryFields()}, this.receivedPlotData.bind(this));

    }
    receivedPlotData(data){
      var vals = data;
      for(var i = 0; i < vals.length; i++){
        vals[i]["date"]= mjd2cal(vals[i]["agent_utc"]).getTime()
      }
      var min, max;
      min = mjd2cal(vals[0]["agent_utc"]).getTime();
      max = mjd2cal(vals[data.length-1]["agent_utc"]).getTime();
      this.setState({
        data:vals,
        slider:{
          min:min,
          max: max,
          start:min,
          end:max}
        });
    }
    pauseLivePlot(){
      var l = this.state.live;
      l.pause = true;
      this.setState({live:l,
        slider:{
          min:this.state.live_data[0]["date"],
          max:this.state.live.current_data["date"],
          start:this.state.live_data[0]["date"],
          end: this.state.live.current_data["date"],
        }})
    }
    resumeLivePlot(){
      var l = this.state.live;
      l.pause = false;
      this.setState({live:l})
    }

    render() {
      const legend = [];
      var selected_dates;
      var date_form, slider,plot_domain, action;
      var disable_switch = false;
      var slider_visible = false;
      var data_source;
      var title= <div> {"Agent "+this.props.info.agent} <Badge status="default" /></div>
      if(this.props.info.live){
        title= <div> {"Agent "+this.props.info.agent} <Badge status="processing" /></div>
      }
      if(this.state.live_view){
        // render legend - holds value of current data
        data_source = this.state.live_data;
        const labels = this.props.info.values.label;
        for(var j=0; j<labels.length; j++){
          var color={color:colors[j%colors.length]}
          legend.push(<div key={String(j)}><h4 style={color}>{labels[j]}</h4><p >{this.state.live.current_data[labels[j]]}</p></div>);

        }
        plot_domain = ['auto, auto'];
        if(this.state.live.pause)
        {
          slider_visible=true;

          action = <Button type="default" onClick={this.resumeLivePlot.bind(this)}> Resume </Button>
        }
        else {
          action = <Button type="default" onClick={this.pauseLivePlot.bind(this)}> Pause </Button>
        }
        if(!this.props.info.archive) disable_switch=true;
      }
      else {
        // render Datepicker and slider
        data_source= this.state.data;
        if(this.state.archive.date_picker.start !== null){
          selected_dates = [moment(this.state.archive.date_picker.start), moment(this.state.archive.date_picker.end)]
        }
        date_form =     <RangePicker
            disabledDate={this.disabledDate.bind(this)}
            value={selected_dates}
            onChange={this.onDateChange.bind(this)}
            format="YYYY-MM-DD"
          />
        slider_visible = true;

        if(!this.props.info.live) {
          disable_switch=true;
        }
      }
      if(slider_visible){
        plot_domain = [this.state.slider.start, this.state.slider.end]
        slider = <Slider range value={[this.state.slider.start, this.state.slider.end]}
            min={this.state.slider.min}
            max={this.state.slider.max}
            onChange={this.sliderChange.bind(this)}
            tipFormatter={convertTimetoDate}/>
      }

      return (
        <Card
          style={{ width: '100%' }}
          title={title}
          extra={(this.props.info.live && this.props.info.archive) &&
            <div>Live View
                <Switch checked={this.state.live_view}
                onChange={this.onChangeView.bind(this)}
                disabled={disable_switch}/>
            </div>}
        >
        <div>
        <Row>{date_form}</Row>
        <Row gutter={16}>
          <Col span={18} >
            {slider}
            <PlotBox info={this.props.info} plot_domain={plot_domain} data={data_source}/>
            </Col>
            <Col span={6} >
            <Card title={this.props.info.agent}>
              {legend}
              {action}
            </Card>
            </Col>
          </Row>
        </div>
        </Card>
      );


    }
}

export default CosmosPlot;