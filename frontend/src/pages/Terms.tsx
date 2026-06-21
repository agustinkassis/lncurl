import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LAST_UPDATED = "June 21, 2026";

export function Terms() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Terms of Use</h1>
        <p className="text-muted-foreground">
          The rules for using lncurl.lol. Short version: it's a toy, don't trust
          it with money you care about.
        </p>
        <p className="text-sm mt-1 text-muted-foreground font-mono">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* Custody warning */}
      <Card className="border-danger">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-danger">
            CUSTODY WARNING
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            lncurl.lol is a <strong>custodial service</strong>. All wallets live
            on a single shared{" "}
            <a
              href="https://getalby.com/alby-hub?ref=lncurl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal hover:underline"
            >
              Alby Hub
            </a>{" "}
            instance that we control. You are trusting us to hold your sats.
          </p>
          <p>
            <strong>Do not</strong> store meaningful amounts here. This service
            is designed for agents, quick tests, and small amounts. Wallets are
            charged hourly and are destroyed when their balance hits zero — and
            the sats are gone with them.
          </p>
        </CardContent>
      </Card>

      {/* The service */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            THE SERVICE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            lncurl.lol creates disposable, custodial bitcoin lightning wallets
            over a single HTTP call. Each wallet returns a Nostr Wallet Connect
            connection string you can use with any compatible app or agent. By
            creating or using a wallet, you agree to these terms. If you don't
            agree, don't use the service.
          </p>
        </CardContent>
      </Card>

      {/* How it works / fees */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            FEES &amp; WALLET LIFECYCLE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Hourly fee.</strong> A small
              maintenance fee is deducted from each wallet every hour to cover
              hosting.
            </li>
            <li>
              <strong className="text-foreground">Death.</strong> When a wallet's
              balance can no longer cover the fee, the wallet is permanently
              destroyed and moved to the{" "}
              <Link to="/graveyard" className="text-terminal hover:underline">
                Graveyard
              </Link>
              . Its connection string and lightning address stop working.
            </li>
            <li>
              <strong className="text-foreground">No recovery.</strong> Dead
              wallets cannot be restored. There is no password reset, no backup,
              and no support channel to recover funds or access.
            </li>
            <li>
              <strong className="text-foreground">Rate limits.</strong> Wallet
              creation is rate-limited per IP. We may adjust limits or fees at
              any time without notice.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Acceptable use */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            ACCEPTABLE USE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              Use the service for any illegal purpose, including money
              laundering, fraud, or sanctions evasion.
            </li>
            <li>
              Abuse, overload, or attempt to disrupt the service, its
              infrastructure, or its rate limits.
            </li>
            <li>
              Attempt to access wallets, data, or systems that are not yours.
            </li>
            <li>
              Put unlawful, abusive, or sensitive content into epitaphs or any
              other public field. Epitaphs are displayed publicly on the
              Graveyard.
            </li>
          </ul>
          <p className="text-muted-foreground">
            We may remove content, destroy wallets, or block access at our sole
            discretion to keep the service running.
          </p>
        </CardContent>
      </Card>

      {/* No warranty */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            NO WARRANTY
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            The service is provided <strong>"as is"</strong> and{" "}
            <strong>"as available"</strong>, without warranties of any kind,
            express or implied. We do not guarantee uptime, durability of funds,
            or that the service will keep operating. It is experimental software
            and may change, break, or shut down at any time. We may delete any or
            all wallets, with or without notice.
          </p>
        </CardContent>
      </Card>

      {/* Liability */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            LIMITATION OF LIABILITY
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, lncurl.lol and its operators
            are not liable for any loss of funds, data, or profits, or for any
            indirect, incidental, or consequential damages arising from your use
            of the service. Your maximum recoverable amount is limited to the
            balance held in your wallet at the time of the claim. You use this
            service entirely at your own risk.
          </p>
        </CardContent>
      </Card>

      {/* Eligibility & changes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">
            ELIGIBILITY &amp; CHANGES
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            You must be of legal age to use this service in your jurisdiction and
            responsible for complying with the laws that apply to you. We may
            update these terms at any time; continued use after a change means
            you accept the updated terms. See also our{" "}
            <Link to="/privacy" className="text-terminal hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
