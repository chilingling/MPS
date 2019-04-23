import React, { Component } from 'react';
// import XLSX from 'xlsx'
import './App.css';

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataSource: [
        {
          key: '0',
          timezone: '时区',
          current: '当期',
          require: '需求时区',
          plan: '计划时区',
          predict: '预测时区'
        },
        {
          key: '1',
          timezone: '时段',
          // current: '预测量',
          require: '1',
          plan: '计划时区',
          predict: '预测时区'
        }
      ],
      count: 2,
      currentStore: 120, // 现有库存量
      safeStore: 20, // 安全库存量
      probatch: 160, // 生产批量
      addbatch: 160, // 批量增量值
      advance: 1, // 提前期
      predictList: [70, 70, 70, 70, 70, 80, 80, 80, 80, 80], // 预测量
      orderList: [100, 90, 80, 60, 70, 90, 50, 100, 90, 70], // 订单量
      grossList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 毛需求量
      planList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 计划接收量
      PABinitList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // PAB初值
      netList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 净需求量
      planOutList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 计划产出量
      PABOutList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // PAB
      planInputList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 计划投入量
      ATPList: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // ATP
    }
  }
  handleSave = row => {
    const newData = [...this.state.dataSource]
    const index = newData.findIndex(item => row.key === item.key)
    const item = newData[index]
    newData.splice(index, 1, {
      ...item,
      ...row
    })
    this.setState({
      dataSource: newData
    })
  }
  componentDidMount () {
    this.handleCompute()
    this.exportFile()
  }
  exportFile = () => {
    // let data = [this.state.predictList, this.state.orderList]
    // const ws = XLSX.utils.aoa_to_sheet(data)
    // const wb = XLSX.utils.book_new()
    // XLSX.utils.book_append_sheet(wb, ws, "MPS")
    // XLSX.writeFile(wb, 'MPS.xlsx')
  }
  handleCompute = () => {
    let newgrossList = this.state.grossList
    newgrossList = newgrossList.map((item, index) => { // 计算毛需求量
      if (index < 2) {
        return this.state.orderList[index]
      } else if (index < 6) {
        return Math.max(this.state.orderList[index], this.state.predictList[index])
      } else {
        return this.state.predictList[index]
      }
    })
    let newPABinitList = this.state.PABinitList // PAB初值
    let newplanList = this.state.planList // 计划接收量
    let newnetList = this.state.netList // 净需求量
    let newplanOutList = this.state.planOutList // 计划产出量
    let newPABOutList = this.state.PABOutList // 当前时段的PAB值
    let newplanInputList = this.state.planInputList // 计划投入量
    newPABinitList[0] = this.state.currentStore // 当期的PAB 初值
    newPABinitList[1] = this.state.currentStore - newgrossList[0] // 第一时段的PAB初值
    // newplanList[0] = newPABinitList[0] > this.state.safeStore ? 0 : this.state.addbatch // 计划接收量
    newnetList[0] = newPABinitList[1] > this.state.safeStore ? 0 : this.state.safeStore - newPABinitList[1]
    newplanOutList[0] = newPABinitList[1] > 0 ? 0 : this.state.addbatch
    newPABOutList[0] = newPABinitList[0] + newplanList[0] - newgrossList[0] + newplanOutList[0]
    newplanInputList[0] = newplanOutList[0]
    for (let i  = 1; i < 10; ++i) {
      newPABinitList[i+1] = newPABOutList[i-1] - newgrossList[i] // 第一时段的PAB初值
      // newplanList[i] = newPABinitList[i-1] > this.state.safeStore ? 0 : this.state.addbatch // 计划接收量
      newnetList[i] = newPABinitList[i+1] > this.state.safeStore ? 0 : this.state.safeStore - newPABinitList[i+1]
      newplanOutList[i] = newnetList[i] !== 0 ? this.state.addbatch : 0
      newPABOutList[i] = newPABOutList[i-1] + newplanOutList[i] - newgrossList[i]
      newplanInputList[i] = newplanOutList[i]
    }
    newplanInputList[10] = 0
    // 计算ATP
    let newatp = this.state.ATPList
    for (let i = 0; i < 10; ++i) {
      let tmp0 = this.state.orderList[i], j = i + 1
      while (j < 10 && newplanOutList[j] === 0) {
        tmp0 += this.state.orderList[j]
        ++j;
      }
      // console.log(newplanOutList[i], newplanList[i], tmp0)
       newatp[i] =  newplanOutList[i] === 0 ? 0 : newplanOutList[i] + newplanList[i] - tmp0
    }
    this.setState({
      grossList: newgrossList,
      PABinitList: newPABinitList,
      // planList: newplanList,
      netList: newnetList,
      planOutList: newplanOutList,
      PABOutList: newPABOutList,
      planInputList: newplanInputList,
      ATPList: newatp
    })
  }
  render() {
    return (
      <div className="App">
        <h1>MPS报表</h1>
        <div className="current-box">
          <span className="current-item">现有库存量：<input className="header-input" type="number" min="0" value = {this.state.currentStore} onChange = {(e) => this.setState({  currentStore: Number(e.target.value) }, () => this.handleCompute())}/></span>
          <span className="current-item">安全库存量：<input className="header-input" type="number" min="0" value = {this.state.safeStore} onChange = {(e) => this.setState({  safeStore: Number(e.target.value) }, () => this.handleCompute())}/></span>
          <span className="current-item">生产批量：<input className="header-input" type="number" min="0" value = {this.state.probatch} onChange = {(e) => this.setState({  probatch: Number(e.target.value) }, () => this.handleCompute())}/></span>
          <span className="current-item">批量增量：<input className="header-input" type="number" min="0" value = {this.state.addbatch} onChange = {(e) => this.setState({  addbatch: Number(e.target.value) }, () => this.handleCompute())}/></span>
          <span className="current-item">提前期：<input className="header-input" type="number" min="0" value = {this.state.advance} onChange = {(e) => this.setState({  advance: Number(e.target.value) }, () => this.handleCompute())}/> 时段</span>
        </div>
        <div className='table-box'>
        <table>
          <thead>
            <tr>
              <td>时区</td>
              <td>当期</td>
              <td colSpan="2">需求时区</td>
              <td colSpan="4">计划时区</td>
              <td colSpan="4">预测时区时区</td>
            </tr>
            <tr>
              <td key="title">时段</td>
              <td></td>
              <td>1</td>
              <td>2</td>
              <td>3</td>
              <td>4</td>
              <td>5</td>
              <td>6</td>
              <td>7</td>
              <td>8</td>
              <td>9</td>
              <td>10</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td key="pretitle">预测量</td>
              <td key="empty"></td>
              {
                this.state.predictList.map((item, index) => 
                <td key={index}><input style={{ width: '46px' }} type="number" min="0" value={item} onChange = {(e) => {
                  this.setState({ predictList: this.state.predictList.map((item, ind) => {
                    if (ind === index) {
                      return e.target.value
                    } else {
                      return item
                    }
                })}, () => this.handleCompute())}}/></td>)
              }
            </tr>
            <tr>
              <td key="title">订单量</td>
              <td key="empty"></td>
              {
                this.state.orderList.map((item, index) => <td key={index}><input style={{ width: '46px' }} type="number" min="0" value={item} onChange = {(e) => {
                  this.setState({ orderList: this.state.orderList.map((item, ind) => {
                    if (ind === index) {
                      return e.target.value
                    } else {
                      return item
                    }
              })}, () => this.handleCompute())}}/></td>)
              }
            </tr>
            <tr>
              <td key="title">毛需求量</td>
              <td key="empty"></td>
              {
                this.state.grossList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">计划接收量</td>
              <td key="empty"></td>
              {
                this.state.planList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">PAB初值</td>
              {
                this.state.PABinitList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">净需求量</td>
              <td key="empty"></td>
              {
                this.state.netList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">计划产出量</td>
              <td key="empty"></td>
              {
                this.state.planOutList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">PAB</td>
              <td key="empty"></td>
              {
                this.state.PABOutList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">计划投入量</td>
              {
                this.state.planInputList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
            <tr>
              <td key="title">ATP</td>
              <td key="empty"></td>
              {
                this.state.ATPList.map((item, index) => <td key={index}>{item || ''}</td>)
              }
            </tr>
          </tbody>
          {/* <tfoot></tfoot> */}
        </table>
        </div>
      </div>
    );
  }
}

export default App;
