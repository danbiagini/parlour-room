import React from "react";
import "./App.scss";
import { Jumbotron } from "react-bootstrap";

export default function About() {
  return (
    <Jumbotron className="bg-transparent">
      <div className="lander">
        <h1>A Place for families and friends to stay connected</h1>
      </div>
      <div>
        <div>
          According to{" "}
          <a href="https://en.wikipedia.org/wiki/Parlour" title="WIkpedia">
            Wikipedia
          </a>
          :<br />A <b>parlour</b> (or <b>parlor</b>) is a{" "}
          <a
            draggable="true"
            href="https://en.wikipedia.org/wiki/Reception_room"
            title="Reception room"
          >
            reception room
          </a>{" "}
          or public space. In{" "}
          <a
            draggable="true"
            href="https://en.wikipedia.org/wiki/Middle_Ages"
            title="Middle Ages"
          >
            medieval{" "}
          </a>
          <a
            draggable="true"
            href="https://en.wikipedia.org/wiki/Christianity"
            title="Christianity"
          >
            Christian{" "}
          </a>
          Europe, the &quot;outer parlour&quot; was the room where the monks or
          nuns conducted business with those outside the monastery and the
          &quot;inner parlour&quot; was used for necessary conversation between
          resident members. In the English-speaking world of the 18th and 19th
          century, having a parlour room was evidence of social status.
        </div>
      </div>
      <br />
      <div>
        <div>
          <h3>Why Pandemic Parlour</h3>
        </div>
        <div title="Pandemic_Mission" id="ifuvf">
          <div>
            I decided to build Pandemic Parlour for a couple reasons. I&#039;ve
            always had a desire to create and build using technology while also
            providing something useful to others. When the COVID pandemic and
            quarantining began I noticed a few challenges with keeping connected
            with families and friends. What we needed was way to have the
            &quot;inner parlour&quot; for families and friends to congregate,
            especially for younger kids who don&lsquo;t sit still long enough
            for a video chat. Pandemic Parlour is a place to chat, play games
            and generally interact. It is designed to be kid safe, and
            ultimately a way to bridge the technology gap between family members
            of all ages. <br />
          </div>
        </div>
      </div>
    </Jumbotron>
  );
}
