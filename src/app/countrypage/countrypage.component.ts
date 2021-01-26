import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartDataSets, ChartType } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { Countrysummary } from '../countrysummary';
import { COVID19Service } from '../covid19.service';
import { GlobalSummary } from '../globalsummary';

@Component({
  selector: 'app-countrypage',
  templateUrl: './countrypage.component.html',
  styleUrls: ['./countrypage.component.css']
})
export class CountrypageComponent implements OnInit {

  Selected: String;
  globalsummary: GlobalSummary;
  countriessummary : Countrysummary;
  ActiveCases : number;
  RecoveryRate: number;
  MortalityRate: number;
  ChartData: ChartDataSets[];
  ChartLabels: Label[];
  ChartOptions = {};
  ChartColors: Color[];
  ChartLegend:boolean;
  ChartPlugins: any ;
  ChartType :ChartType;
  barChartType :ChartType;
  barChartData: ChartDataSets[];
  barChartLabels: Label[];
  barChartOptions = {};
  barChartLegend:boolean;
  lineChartType :ChartType;
  lineChartData: ChartDataSets[];
  lineChartLabels: Label[];
  lineChartOptions = {};
  lineChartLegend:boolean;
  DateToday: any;
  user: any;
  News: any;


  constructor(public covid19Service: COVID19Service, private httpClient: HttpClient,private router: Router) { }


  

  async ngOnInit(): Promise<void> {
    this.Selected = localStorage.getItem("SelectedCountry");
    this.covid19Service.prepareTexttoDefile(this.Selected)
    this.covid19Service.getSummaryAPI();

    await this.covid19Service.delay(500);

    // Global Summary Management and displays
    const dict = await this.covid19Service.createCountryIdDict();
    let currentIdcountry = null;
    let currentcountry = null;
    for (let j = 0; j< dict.length; j++){
      if ( dict[j]['Country'] == this.Selected){
        currentIdcountry = dict[j]['Id']
      }
    }

    const Global = this.covid19Service.getCountrySummary(currentIdcountry);
    Global.subscribe((response) => {
      this.countriessummary = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.covid19Service.delay(1000);

    const TheNews = this.covid19Service.getStringtoDefile(this.Selected)
    TheNews.subscribe((response) => {
      this.News = response["Defile"]
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });

    //prepare year
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const theDate = new Date(this.countriessummary.Date.toString())
    const day = theDate.getDate()
    const month = formatter.format(new Date(this.countriessummary.Date.toString()))
    const year = theDate.getFullYear()
    this.DateToday = day.toString()+" "+month.toString()+" "+year

    this.covid19Service.saveSummaryAPI();
    this.ActiveCases = <any>this.countriessummary.TotalConfirmed - <any>this.countriessummary.TotalRecovered;
    this.RecoveryRate = Math.round((<any>this.countriessummary.TotalRecovered / <any>this.countriessummary.TotalConfirmed) * 10000) / 100;
    this.MortalityRate = Math.round((<any>this.countriessummary.TotalDeaths / <any>this.countriessummary.TotalConfirmed) * 10000) / 100;
    this.ChartData = [
      { data: [<number>this.countriessummary.TotalDeaths, <number>this.countriessummary.TotalRecovered, this.ActiveCases], label: 'Cases Repartition' },
    ];
    this.ChartLabels = ['Dead Case', 'Recovered Case', 'Active Case'];
    this.ChartOptions = { responsive: true,};
    this.ChartColors = [{borderColor: ['white','white','white'],
                         backgroundColor: ['rgba(225,155,171)','rgba(148,198,239)','rgba(249,226,166)'],},
                       ];
    this.ChartLegend = true;
    this.ChartPlugins = [];
    this.ChartType = 'pie';

    let BarChartDatas = await this.covid19Service.createWeekDBBycountry(this.countriessummary.Slug)

    this.barChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true
    };
    this.barChartLabels = <Label[]>BarChartDatas[0];
    this.barChartType = 'bar';
    this.barChartLegend = true;
    this.barChartData = [
      {data: <(number | number[])[] | Chart.ChartPoint[]>BarChartDatas[1], label: 'Daily Deaths'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>BarChartDatas[2], label: 'Daily Recovered'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>BarChartDatas[3], label: 'Daily New Case'}
    ];



    let lineChartDatas = await this.covid19Service.sinceDayOneByCountry(this.countriessummary.Slug)
    this.lineChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true,
    };
    this.lineChartLabels = <Label[]>lineChartDatas[0];
    this.lineChartType = 'line';
    this.lineChartLegend = true;
    this.lineChartData = [
      {data: <(number | number[])[] | Chart.ChartPoint[]>lineChartDatas[1], label: 'Total Deaths'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>lineChartDatas[2], label: 'Total Recovered'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>lineChartDatas[3], label: 'Total Cases'}
    ];

  }

  goBackToWorld(){
    this.router.navigate(["signin"]);
    localStorage.removeItem("SelectedCountry");
  }

  async actionSignIn(){
    while(!this.covid19Service.userSignedIn()){
      await this.covid19Service.delay(100)
    }
    this.user = this.covid19Service.getUser();
    const name = this.user.displayName
    document.getElementById('nameHTML').innerHTML = ' <p id="nameHTML">'+name+'</p> '
  }

  actionSignOut(){
    if(localStorage.getItem("user")==null){
      window.alert("You need to be signed in !!")
    }
    else{
      this.covid19Service.signOut()
      document.getElementById('nameHTML').innerHTML = ' <p></p> '
      document.getElementById('SignOutHTML').innerHTML =' <p></p> '
    }
  }

  onSubmit(text:String){
    if(localStorage.getItem("user")==null){
      window.alert("You need to be signed in !!")
    }
    else{
      const Description = text
      const user = this.user.displayName
      this.covid19Service.addNews(Description, this.Selected, user )
    }
    
  }

  async updateNews(){
    await this.covid19Service.delay(800)
    this.covid19Service.prepareTexttoDefile(this.Selected)
    const TheNews = this.covid19Service.getStringtoDefile('Worldwide')
    TheNews.subscribe((response) => {
      this.News = response["Defile"]
    },
    (error) => {
     console.log('Erreur ! :' + error)
    });
  }
}