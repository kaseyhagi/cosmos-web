import React, { Component } from 'react';
import io from 'socket.io-client';
import { Card,  Button, Icon, Modal, Popover, Layout, Table} from 'antd';
import PlotWidget from './PlotWidget'
import WidgetForm from './WidgetForm'
// import CosmosWidgetConfig from './CosmosWidgetConfig'
import cosmosInfo from './../Cosmos/CosmosInfo'
const socket = io(cosmosInfo.socket);
const ButtonGroup = Button.Group;
const {
  Header, Content, Footer, Sider,
} = Layout;

export const widgetType = {
  NONE: 0,
  LIVE_PLOT: 1,
  AGENT_COMMAND: 2,
  COSMOS_DATA:3
};
class Widget extends Component {
/* props={
  agent: CosmosAgent(),
  widget_type: widgetType,
  title: String,
  data_name : [ "device_imu_omega_000", "device_gps_geods_000"],
  data_key: {}
  plot_labels: ["xlabel", "ylabel"],
  plot_range: [Number(xRange), Number(yRange)],
  command_string: "status"
} */

  constructor(props){
    super(props);
      this.state = {
        view_form:true,
        data:[],
        form:{},
        prevData:{}
      };
  }
  componentWillMount() {
    this.setState({form: this.props.info});
  }
  updateForm(e){
    // console.log(e)
    var form=this.state.form;
    if(e.key==="xLabel"){
      form.plot_labels[0]= e.value;
    }
    else if(e.key==="yLabel"){
      form.plot_labels[1]= e.value;
    }
    else {
      form[e.key]=e.value;
    }

    this.setState({form:form})
  }
  onSaveForm(){
    var form = this.state.form;
    this.props.updateWidget({form:form, id:this.props.id});
    this.setState({view_form:false})
  }
  hideModal(){
    this.setState({view_form:false, form: this.props.info})
  }
  componentDidUpdate(prevProps){

    if(prevProps.data.agent_utc!== this.props.data.agent_utc){
      if(this.props.info.widget_type===widgetType.LIVE_PLOT){
        // console.log(this.props.data)
        var data= this.state.data;
        var new_data = this.props.data;
        data=[...data,new_data]
        // data[data.length]= new_data

        this.setState({data:data})
      }
    }
  }
  openModal(){
    this.setState({view_form:true})
  }
    // onClickCommand(){
    //   socket.emit('agent_command',
    //     {agent: this.props.info.command.agent, node: this.props.info.command.node, command: this.props.info.command },
    //     this.commandResponseReceived.bind(this));
    // }
    // commandResponseReceived(data){
    //   this.setState({data:<p style={{whiteSpace:'pre-wrap', wordWrap:'break-word'}} >{data.output}</p>})
    // }
  render() {

    var content, table_data;
    // const table_cols = []

    const table_cols = [{title:"Name", dataIndex:"dataname"},{title:"Value", dataIndex:"value"}]
    // console.log("widget.data", this.state.data, this.props.data)
    if(!this.state.view_form){
      switch(this.props.info.widget_type){
        case(widgetType.LIVE_PLOT):
        // if(this.state.info)
            content = <PlotWidget info={this.props.info} plot_domain={['auto, auto']} data={this.state.data}/>
            // console.log(this.state.info)
        break;
        case(widgetType.AGENT_COMMAND):
          // content =<div>
          //   <Button onClick={this.onClickCommand.bind(this)}>{this.props.info.command.title}</Button>
          //   <div style={{ overflowY:'scroll', height:'200px'}}>
          //     {this.state.data}
          //   </div>
          // </div>
        break;
        case(widgetType.COSMOS_DATA):
          if(this.props.info.agent){
            table_data=[];
            for(var i=0; i < this.props.info.values.label.length; i++){
              table_data.push({key:i, dataname: this.props.info.values.label[i], value: this.props.data[this.props.info.values.label[i]]})
            }
            console.log(table_data)
            content = <Table columns={table_cols} dataSource={table_data} size="small"  pagination={false}/>
          }

        break;
        default:

        break;
      }
    }
    const widget_actions=( <ButtonGroup size="small">
      <Button  onClick={this.openModal.bind(this)}><Icon type="setting"/></Button>
      <Button  onClick={this.props.selfDestruct.bind(this.props.id)}><Icon type="delete"/></Button>
    </ButtonGroup>);

    const widget_style ={
      border:'1px solid #e1e6ef',
      background: '#fff',
      padding:'10px' ,
      borderRadius: "10px"
    }

    return(
      <Layout style={widget_style}>
        <Modal
            visible={this.state.view_form}
            title="Add Widget"
            onOk={this.onSaveForm.bind(this)}
            onCancel={this.hideModal.bind(this)}
          >
          <WidgetForm info={this.state.form}
            updateForm={this.updateForm.bind(this)}
            newAgent={this.props.newAgent}
            structure={this.props.agentStructure}/>
        </Modal>
        <Content>
          <div style={{margin:"10px"}}> <p style={{display:"inline"}}><b>{this.props.info.agent}</b></p>
          <ButtonGroup size="small" style={{display:"inline", float:"right"}}>
            <Button  onClick={this.openModal.bind(this)}><Icon type="setting"/></Button>
            <Button  onClick={this.props.selfDestruct.bind(this.props.id)}><Icon type="delete"/></Button>
          </ButtonGroup>
          </div>
          {content}
        </Content>



      </Layout>
    );


  }
}

export default Widget;