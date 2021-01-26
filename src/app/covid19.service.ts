import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireAuth} from '@angular/fire/auth';
import { User } from './user.model';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, range } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { AngularFirestore } from '@angular/fire/firestore';
import { GlobalSummary } from './globalsummary';
import { Countries } from './countries';
import { Countrysummary } from './countrysummary';
import { ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';


@Injectable({
  providedIn: 'root'
})
export class COVID19Service {
  @ViewChild('agGrid') agGrid: AgGridAngular;

  private user: User;
  private summary: any;
  private Ctotaldayone: any;
  private getsummary: any;
  private countries : any;
  private TotDy1: any;
  ActDat: any;


  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore, private router: Router, private httpClient: HttpClient) { }

  

  getSummaryAPI(){
    this.httpClient.get<any[]>('https://api.covid19api.com/summary')
    .subscribe((response) => {
      this.summary = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    })
  }

  async getDayOneTotalAPI(){
    const Countries = this.getCountries();
    Countries.subscribe((response) => {
      this.countries = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(1000);
    for(let i=0; i<this.countries.length; i++){
      this.httpClient.get<any[]>('https://api.covid19api.com/total/dayone/country/'+ this.countries[i]['Slug'])
      .subscribe((response) => {
        this.Ctotaldayone = response
      },
      (error) => {
        console.log('Erreur 1 ! :' + error)
      })
      await this.delay(1300);
      this.httpClient
      .put('https://covid-19-7a9fb.firebaseio.com/CountryDayOneTotal/'+this.countries[i]['Slug']+'.json', this.Ctotaldayone)
      .subscribe(
        () => {
          console.log('Enregistrement terminé !');
        },
        (error) => {
          console.log('Erreur 2 ! : ' + error);
        }
      );
    }
    
  }

  saveSummaryAPI(){
    this.httpClient
    .put('https://covid-19-7a9fb.firebaseio.com/Summary.json', this.summary)
    .subscribe(
      () => {
        console.log('Enregistrement terminé !');
      },
      (error) => {
        console.log('Erreur ! : ' + error);
      }
    );
  }

  getGlobal(){
    return this.httpClient.get<GlobalSummary>('https://covid-19-7a9fb.firebaseio.com/Summary/Global.json')
  }

  getCountries(){
    return this.httpClient.get<Countrysummary>('https://covid-19-7a9fb.firebaseio.com/Summary/Countries.json')
  }

  getCountrySummary(idCountry: Number){
    return this.httpClient.get<Countrysummary>('https://covid-19-7a9fb.firebaseio.com/Summary/Countries/'+idCountry.toString()+'/.json')
  }

  async createCountryIdDict(){
    const Countries = this.getCountries()
    Countries.subscribe((response) => {
      this.countries = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(1500)
    let dict = [{Country: this.countries[0]["Country"],CountrySlug: this.countries[0]["Slug"], Id: 0}]
    for(let i = 1; i<this.countries.length; i++){
      dict.push({Country: this.countries[i]["Country"],CountrySlug: this.countries[i]["Slug"], Id: i})
    }
    return dict
  }

  async getAndComputeTotalDayOneByCountry(country: String){
    const TotalDayOne = this.httpClient.get<any>('https://covid-19-7a9fb.firebaseio.com/CountryDayOneTotal/'+country+'.json')
    TotalDayOne.subscribe(async (response) => {
      this.TotDy1 = response
      console.log(this.TotDy1)
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(700)
    let dict1=[{Date:"2020-04-13T00:00:00Z",Deaths:0,Recovered:0,Active:0,Country:this.TotDy1[0]["Country"]}];
    let count = 0;
    let t = 0;
    for(let i=0; i<this.TotDy1.length; i++){
      try{
        t=1
        let currentDate = new Date(this.TotDy1[i].Date)
        t=2
        var compareDate = new Date("2020-04-14T00:00:00Z")
        if ( currentDate >= compareDate ){
            count=1;
        }
        if (count == 1){
          t=3
          dict1.push({Date:this.TotDy1[i].Date,Deaths:0,Recovered:0,Active:0,Country:this.TotDy1[0]["Country"]});
          t=4
        }
        }
        catch(e){
        }
    }

    let count2=0;
    let start = 0;
    for(let j=0; j<this.TotDy1.length; j++){
      let currentDate = new Date(this.TotDy1[j].Date)
      var compareDate = new Date("2020-04-13T00:00:00Z")
      if (currentDate >= compareDate){
        count2 = 1;
      }
      if (count2 == 1){
        dict1[start].Deaths = this.TotDy1[j].Deaths;
        dict1[start].Recovered = this.TotDy1[j].Recovered;
        dict1[start].Active = this.TotDy1[j].Active;
        start++;
      }
    } 
  return (dict1)
  }

  async getAndComputeTotalDayOneAndAdapt(){
    const Countries = this.getCountries();
    Countries.subscribe((response) => {
      this.countries = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(4000);
    
    let dictFinal = await this.getAndComputeTotalDayOneByCountry(this.countries[0]['Slug']);
    for(let i=1; i<this.countries.length; i++){
      try{
        let dict=null
       dict = await this.getAndComputeTotalDayOneByCountry(this.countries[i]['Slug']); 
       let f=0;
       
       for(let j=0; j<dictFinal.length; j++){
        if(this.countries[i]['Country'] == dict[f]['Country']){
         let currentDate1 = null;
         let actualDate1 = null;
         currentDate1 = dict[f].Date
         actualDate1 = dictFinal[j].Date


         if ( currentDate1 == actualDate1 ){
           dictFinal[j].Deaths = dictFinal[j].Deaths + dict[f].Deaths;
           dictFinal[j].Recovered = dictFinal[j].Recovered + dict[f].Recovered;
           dictFinal[j].Active = dictFinal[j].Active + dict[f].Active;
           f++; 
         }
         else{
           console.log("ahbentiens")
         }
        }

       }
      }
      catch(e){
        console.error(e);
      }

    }

    this.httpClient
    .put('https://covid-19-7a9fb.firebaseio.com/WorldDayOne.json', dictFinal)
    .subscribe(
      () => {
        console.log('Enregistrement terminé !');
      },
      (error) => {
        console.log('Erreur ! : ' + error);
      }
    );
    return dictFinal
  }

  async getDayOneWorld(){
    const dict = await this.getAndComputeTotalDayOneByCountry("france")
    for (let i = 0; i< dict.length-1; i++ ){
      let previousdate = dict[i]['Date']
      let nextdate = dict[i+1]['Date']
      const actualdatesituation = this.httpClient.get<any>("https://api.covid19api.com/world?from="+previousdate+"Z&to="+nextdate+"Z")
      actualdatesituation.subscribe(async (response) => {
      this.ActDat = response
      console.log(this.ActDat)
      },
      (error) => {
        console.log('Erreur ! :' + error)
      });

      this.httpClient
      .put('https://covid-19-7a9fb.firebaseio.com/WorldDayOne/'+nextdate+'.json', this.ActDat)
      .subscribe(
      () => {
        console.log('Enregistrement terminé !');
      },
      (error) => {
        console.log('Erreur ! : ' + error);
      }
    );

    }

  }

  async getlast30World(){
    const today = new Date()
    const firstDate = new Date("2020-04-14T00:00:00Z")
    const diff = Math.round(((today.getTime() - firstDate.getTime())/ (1000 * 3600 * 24)))
    return this.httpClient.get(" https://disease.sh/v3/covid-19/historical/all?lastdays="+diff.toString())

  }

  async setlast30World(){
    const last30World = await this.getlast30World()
    let last30: any = {cases:"test", recoveries:"test", deaths:"test"}
    last30World.subscribe(async (response) => {
      last30 = response

      },
      (error) => {
        console.log('Erreur ! :' + error)
      });
    await this.delay(1500)
    let dates = Object.keys(last30["cases"])
    let cases = Object.values(last30["cases"])
    let recovered = Object.values(last30["recovered"])
    let deaths = Object.values(last30["deaths"])
    let dict = [{Date:dates[0], Cases:cases[0], Recovered: recovered[0], Deaths: deaths[0]}]
    for(let i = 1; i< dates.length; i++){
      dict.push({Date:dates[i], Cases:cases[i], Recovered: recovered[i], Deaths: deaths[i]})
    }
    this.httpClient
      .put('https://covid-19-7a9fb.firebaseio.com/last30World.json', dict)
      .subscribe(
      () => {
        console.log('Enregistrement terminé !');
      },
      (error) => {
        console.log('Erreur ! : ' + error);
      }
    );

  }

  async getLastWorld(Number:String){
    const lastWorld = this.httpClient.get('https://covid-19-7a9fb.firebaseio.com/last30World.json')
    let last: any = [{Date:'dates[0]', Cases:'cases[0]', Recovered: 'recovered[0]', Deaths: 'deaths[0]'}]
    lastWorld.subscribe(async (response) => {
      last = response
      },
      (error) => {
        console.log('Erreur ! :' + error)
    });

    await this.delay(1700)
    if(Number == 'last8'){
      let dailyDeaths = []
      let dailyRecovered = []
      let dailyNewCase = []
      let dates = []
      const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
      for(let i = last.length-7; i<last.length;i++){
        let currentDDeaths = null
        let currentDRecovered = null
        let currentDNewCase = null
        currentDDeaths = <any>last[i]["Deaths"] - <any>last[i-1]["Deaths"]
        currentDRecovered = <any>last[i]["Recovered"] - <any>last[i-1]["Recovered"]
        currentDNewCase = <any>last[i]["Cases"] - <any>last[i-1]["Cases"]
        dailyDeaths.push(currentDDeaths)
        dailyRecovered.push(currentDRecovered)
        dailyNewCase.push(currentDNewCase)
        const theDate = new Date(last[i]["Date"])
        const day = theDate.getDate()
        const month = formatter.format(new Date(last[i]["Date"]));
        dates.push(day.toString()+" "+month.toString())
      }
      return([dates,dailyDeaths,dailyRecovered,dailyNewCase])
      
    }
    else{
      let Deaths = []
      let Recovered = []
      let NewCase = []
      let dates = []
      const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
      for(let i = 0; i<last.length;i++){
        let currentDDeaths = null
        let currentDRecovered = null
        let currentDNewCase = null
        currentDDeaths = <any>last[i]["Deaths"]
        currentDRecovered = <any>last[i]["Recovered"]
        currentDNewCase = <any>last[i]["Cases"]
        Deaths.push(currentDDeaths)
        Recovered.push(currentDRecovered)
        NewCase.push(currentDNewCase)
        const theDate = new Date(last[i]["Date"])
        const day = theDate.getDate()
        const month = formatter.format(new Date(last[i]["Date"]));
        dates.push(day.toString()+" "+month.toString())
      }
      return([dates,Deaths,Recovered,NewCase])

    }

  }

  async updateCountryDayOneTotal(){
    const Countries = this.getCountries();
    Countries.subscribe((response) => {
      this.countries = response
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(1500);
    for(let i=0; i<this.countries.length; i++){
      this.httpClient.get<any[]>('https://api.covid19api.com/total/dayone/country/'+ this.countries[i]['Slug'])
      .subscribe((response) => {
        this.Ctotaldayone = response
      },
      (error) => {
        console.log('Erreur 1 ! :' + error)
      })
      await this.delay(1000);

      let lastDate = new Date(this.Ctotaldayone[this.Ctotaldayone.length-1]['Date'])
      let dict=null
      
      dict = await this.getAndComputeTotalDayOneByCountry(this.countries[i]['Slug']); 
      let currentlastDate = new Date(dict[dict.length-1]['Date'])
      let count3 = 0;
      for( let j = 0; j< this.Ctotaldayone.length; j++){

        let cdate = new Date(this.Ctotaldayone[j]['Date'])
        if(count3 == 1){
          this.httpClient
          .put('https://covid-19-7a9fb.firebaseio.com/CountryDayOneTotal/'+this.countries[i]['Slug']+'/'+j.toString()+'.json', this.Ctotaldayone[j])
          .subscribe(
          () => {
            console.log('Enregistrement terminé !');
          },
          (error) => {
            console.log('Erreur 2 ! : ' + error);
          }
          );
        }
        if (cdate.toString() == currentlastDate.toString()){
          count3 = 1
          console.log("ok")
        }
      }
      
    }
    
  }

  async createWeekDBBycountry(Country: String){
    this.httpClient.get<any[]>('https://api.covid19api.com/total/country/'+Country)
      .subscribe((response) => {
        this.Ctotaldayone = response
      },
      (error) => {
        console.log('Erreur 1 ! :' + error)
      })
      await this.delay(1000)
      this.httpClient
      .put('https://covid-19-7a9fb.firebaseio.com/WeekByCountry/'+Country+'.json', this.Ctotaldayone)
      .subscribe(
        () => {
          console.log('Enregistrement terminé !');
        },
        (error) => {
          console.log('Erreur ! : ' + error);
        }
      );
      await this.delay(3000)
      let dict = [{Deaths:"test",Recovered:"test",Confirmed:"test",Date:"test"}]
      let current = null
      let currentdate = null
      for(let i = this.Ctotaldayone.length-10; i<this.Ctotaldayone.length;i++){
        current = await this.getDayOfWeek(Country, i)
        current.subscribe((response) => {
          currentdate = response
        },
        (error) => {
          console.log('Erreur 1 ! :' + error)
        })
        await this.delay(400)
        let test: { Deaths: string; Recovered: string; Confirmed: string; Date: string; } = currentdate
        dict.push(test)
      }
      let dailyDeaths = [];
      let dailyRecovered = [];
      let dailyNewCase = [];
      let dates = [];
      const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
      for(let j = 4; j<dict.length;j++){
        let currentDDeaths = null
        let currentDRecovered = null
        let currentDNewCase = null
        currentDDeaths = <any>dict[j]["Deaths"] - <any>dict[j-1]["Deaths"]
        currentDRecovered = <any>dict[j]["Recovered"] - <any>dict[j-1]["Recovered"]
        currentDNewCase = <any>dict[j]["Confirmed"] - <any>dict[j-1]["Confirmed"]
        dailyDeaths.push(currentDDeaths)
        dailyRecovered.push(currentDRecovered)
        dailyNewCase.push(currentDNewCase)
        const theDate = new Date(dict[j]["Date"])
        const day = theDate.getDate()
        const month = formatter.format(new Date(dict[j]["Date"]));
        dates.push(day.toString()+" "+month.toString())
      }
     return([dates,dailyDeaths,dailyRecovered,dailyNewCase])
  }

  async getDayOfWeek(Country: String, Day: Number){
    return this.httpClient.get<any[]>('https://covid-19-7a9fb.firebaseio.com/WeekByCountry/'+Country+'/'+Day.toString()+'.json')
            
  }
  
  async sinceDayOneByCountry(Country: String){
    let dayone = [{Deaths:"test",Recovered:"test",Confirmed:"test",Date:"test"}]
    this.httpClient.get<any[]>('https://covid-19-7a9fb.firebaseio.com/WeekByCountry/'+Country+'.json')
        .subscribe((response) => {
          dayone = response
          
        },
        (error) => {
          console.log('Erreur 1 ! :' + error)
        })
        await this.delay(1500)
        
        let dailyDeaths = [];
        let dailyRecovered = [];
        let dailyNewCase = [];
        let dates = [];
        const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
        for(let j = 0; j<dayone.length;j++){
          let currentDeaths = dayone[j]["Deaths"] 
          let currentRecovered = dayone[j]["Recovered"] 
          let currentNewCase = dayone[j]["Confirmed"] 
          dailyDeaths.push(currentDeaths)
          dailyRecovered.push(currentRecovered)
          dailyNewCase.push(currentNewCase)
          const theDate = new Date(dayone[j]["Date"])
        const day = theDate.getDate()
        const month = formatter.format(new Date(dayone[j]["Date"]));
        dates.push(day.toString()+" "+month.toString())
        }
      return([dates,dailyDeaths,dailyRecovered,dailyNewCase])

  }

  //User part
  async signInWithGoogle(){
    const credientals = await this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    this.user = {
      uid: credientals.user.uid,
      displayName: credientals.user.displayName,
      email: credientals.user.email
    };
    localStorage.setItem("user", JSON.stringify(this.user));
    this.updateUserData();
  }

  private updateUserData(){
    this.firestore.collection("users").doc(this.user.uid).set({
      uid: this.user.uid,
      displayName: this.user.displayName,
      email: this.user.email
    }, { merge: true});
  }

  getUser(){
    if(this.user == null && this.userSignedIn()){
      this.user = JSON.parse(localStorage.getItem("user"));
    }
    return this.user;
  }

  userSignedIn(): boolean{
    return JSON.parse(localStorage.getItem("user")) != null;
  }

  signOut(){
    this.afAuth.signOut();
    localStorage.removeItem("user");
    this.user = null;
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  //News part
  async addNews(Description: String, Country: String, Userpseudo: String){
    const currentnews = this.getNews(Country)
    let news = [{ Description: 'Description', Userpseudo: 'Userpseudo', Date: 'today.toString()'}]
    currentnews.subscribe((response) => {
      news = response
    },
    (error) => {
      console.log('Erreur 1 ! :' + error)
    })
    await this.delay(500)
    let i = 0
    if (news==null){
      i = 0
    }
    else{
      i = news.length
    }
    const today = new Date()
    const DescriptionDict = { Description: Description, Userpseudo: Userpseudo, Date: today.toString()}
    this.httpClient
      .put('https://covid-19-7a9fb.firebaseio.com/News/'+Country+'/'+i.toString()+'.json', DescriptionDict)
      .subscribe(
        () => {
          console.log('Enregistrement terminé !');
          window.alert("Your new is submitted, refresh the page to see it")
        },
        (error) => {
          console.log('Erreur ! : ' + error);
        }
      );
  }

  getNews(Country: String){
    return this.httpClient.get<any>('https://covid-19-7a9fb.firebaseio.com/News/'+Country+'.json')
  }

  async prepareTexttoDefile(Country: String){
    const New = this.getNews(Country)
    let dict = [{ Description: 'Description', Userpseudo: 'Userpseudo', Date: 'today.toString()'}]
    New.subscribe((response) => {
      dict = response 
    },
    (error) => {
      console.log('Erreur ! :' + error)
    });
    await this.delay(1000)
    console.log(dict)
    let StringToReturn 
    let currentString = dict[dict.length-1]
    let Name = currentString.Userpseudo
    let Dates = currentString.Date
    let Description = currentString.Description
    let currentDate = new Date(Dates)
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const day = currentDate.getDate()
    const month = formatter.format(new Date(Dates))
    const year = currentDate.getFullYear()
    const TheDay = day.toString()+" "+month.toString()+" "+year
    let currentStringtoReturn = "« "+Description+" »,  "+Name+", "+TheDay
    StringToReturn = currentStringtoReturn
    for(let i = dict.length-2; i>0; i-- ){
      let currentString = dict[i]
      let Name = currentString.Userpseudo
      let Dates = currentString.Date
      let Description = currentString.Description
      let currentDate = new Date(Dates)
      const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
      const day = currentDate.getDate()
      const month = formatter.format(new Date(Dates))
      const year = currentDate.getFullYear()
      const TheDay = day.toString()+" "+month.toString()+" "+year
      let currentStringtoReturn = "« "+Description+" »,  "+Name+", "+TheDay
      StringToReturn = StringToReturn + "|     |" + currentStringtoReturn
    }
    let DictToPut = {Defile:StringToReturn}
    this.httpClient.put('https://covid-19-7a9fb.firebaseio.com/News/StringToReturn/'+Country+'.json', DictToPut).subscribe(
      () => {
        console.log('Enregistrement terminé !');
      },
      (error) => {
        console.log('Erreur ! : ' + error);
      }
    );
  }

  getStringtoDefile(Country: String){
    return this.httpClient.get<any>('https://covid-19-7a9fb.firebaseio.com/News/StringToReturn/'+Country+'.json')
  }
}
