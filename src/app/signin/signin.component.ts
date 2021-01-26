import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { COVID19Service } from '../covid19.service';
import { GlobalSummary } from '../globalsummary';
import { Summary } from '../summary'
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { Countrysummary } from '../countrysummary';
import { AgGridAngular } from 'ag-grid-angular';
import { Router } from '@angular/router';
import { User } from '../user.model';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @ViewChild('agGrid') agGrid: AgGridAngular;
  @ViewChild('myArea') myArea: any;

  user: User;
  globalsummary: GlobalSummary;
  countriessummary : Countrysummary;
  News: any;
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
  SelectedCountry: String;
  rowSelection: any;
  columnDefs:any;
  columnDefs2:any;
  Today: string;
  DateToday: string;
  nameHTML: InnerHTML;
  SignOutHTML: InnerHTML;
  AddNewsHTML: InnerHTML;
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



  
  





  constructor(public covid19Service: COVID19Service, private httpClient: HttpClient, 
    private router: Router) { }

  async ngOnInit(): Promise<void> {
    this.covid19Service.prepareTexttoDefile('Worldwide')
    this.covid19Service.signOut();
    this.covid19Service.getSummaryAPI();

    await this.covid19Service.delay(500);

    // Global Summary Management and displays
    const Global = this.covid19Service.getGlobal();
    Global.subscribe((response) => {
      this.globalsummary = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });

    const Day = this.httpClient.get<string>('https://covid-19-7a9fb.firebaseio.com/Summary/Date.json')
    Day.subscribe((response) => {
      this.Today = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    
    this.covid19Service.setlast30World()
    
    
    await this.covid19Service.delay(1000);

    const TheNews = this.covid19Service.getStringtoDefile('Worldwide')
    TheNews.subscribe((response) => {
      this.News = response["Defile"]
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });

    //prepare Date
    const theDate = new Date(this.Today)
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const day = theDate.getDate()
    const month = formatter.format(new Date(this.Today))
    const year = theDate.getFullYear()
    this.DateToday = day.toString()+" "+month.toString()+" "+year

    this.covid19Service.saveSummaryAPI();
    this.ActiveCases = <any>this.globalsummary.TotalConfirmed - <any>this.globalsummary.TotalRecovered;
    this.RecoveryRate = Math.round((<any>this.globalsummary.TotalRecovered / <any>this.globalsummary.TotalConfirmed) * 10000) / 100;
    this.MortalityRate = Math.round((<any>this.globalsummary.TotalDeaths / <any>this.globalsummary.TotalConfirmed) * 10000) / 100;

    this.ChartData = [
      { data: [<number>this.globalsummary.TotalDeaths, <number>this.globalsummary.TotalRecovered, this.ActiveCases], label: 'Cases Repartition' },
    ];
    this.ChartLabels = ['Dead Case', 'Recovered Case', 'Active Case'];
    this.ChartOptions = { responsive: true,};
    this.ChartColors = [{borderColor: ['white','white','white'],
                         backgroundColor: ['rgba(225,155,171)','rgba(148,198,239)','rgba(249,226,166)'],},
                       ];
    this.ChartLegend = true;
    this.ChartPlugins = [];
    this.ChartType = 'pie';

    const last8 = await this.covid19Service.getLastWorld("last8")
    this.barChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true
    };
    this.barChartLabels = <Label[]>last8[0];
    this.barChartType = 'bar';
    this.barChartLegend = true;
    this.barChartData = [
      {data: <(number | number[])[] | Chart.ChartPoint[]>last8[1], label: 'Daily Deaths'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>last8[2], label: 'Daily Recovered'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>last8[3], label: 'Daily New Case'}
    ]

    let last = await this.covid19Service.getLastWorld("last")
    this.lineChartOptions = {
      scaleShowVerticalLines: false,
      responsive: true,
    };
    this.lineChartLabels = <Label[]>last[0];
    this.lineChartType = 'line';
    this.lineChartLegend = true;
    this.lineChartData = [
      {data: <(number | number[])[] | Chart.ChartPoint[]>last[1], label: 'Total Deaths'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>last[2], label: 'Total Recovered'},
      {data: <(number | number[])[] | Chart.ChartPoint[]>last[3], label: 'Total Cases'}
    ];

   

    // Countries Summary Management and displays
    const Countries = this.covid19Service.getCountries();
    Countries.subscribe((response) => {
      this.countriessummary = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });


    this.columnDefs = [
      { headerName:'Country', field: 'Country', sortable: true, filter: true, cellStyle:{color: 'white', 'background-color': 'rgba(109,117,123)'}},
      { headerName:'New Cases',field: 'NewConfirmed', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(249,226,166)'}},
      { headerName:'Total Cases',field: 'TotalConfirmed', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(249,226,166)'}},
      { headerName:'New Recoveries',field: 'NewRecovered', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(148,198,239)'}},
      { headerName:'Total Recoveries',field: 'TotalRecovered', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(148,198,239)'}},
      { headerName:'New Deaths',field: 'NewDeaths', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(225,155,171)'}},
      { headerName:'Total Deaths',field: 'TotalDeaths', sortable: true, cellStyle:{color: null, 'background-color': 'rgba(225,155,171)'}},
      this.rowSelection = 'single',
    ];

    
    

  }


  onRowSelected(event: { node: { data: { Country: string; }; isSelected: () => string; }; }) {
    this.SelectedCountry = event.node.data.Country
    console.log(this.SelectedCountry)
    this.router.navigate(["countrypage"]);
    localStorage.setItem("SelectedCountry", this.SelectedCountry.toString());
    }

    async actionSignIn(){
      while(!this.covid19Service.userSignedIn()){
        await this.covid19Service.delay(100)
      }
      this.user = this.covid19Service.getUser();
      const name = this.user.displayName
      console.log(name)
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
        this.covid19Service.addNews(Description, 'Worldwide', user )
      }
      
    }

    async updateNews(){
      console.log("cc")
      
      await this.covid19Service.delay(800)
      this.covid19Service.prepareTexttoDefile('Worldwide')
      const TheNews = this.covid19Service.getStringtoDefile('Worldwide')
      TheNews.subscribe((response) => {
        this.News = response["Defile"]
      },
      (error) => {
       console.log('Erreur ! :' + error)
      });
    }

}

