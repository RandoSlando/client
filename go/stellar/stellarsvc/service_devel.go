// Copyright 2018 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.
//
// +build !production

package stellarsvc

import (
	"context"
	"errors"

	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/stellar1"
	"github.com/keybase/client/go/stellar/remote"
)

func (s *Server) WalletDumpLocal(ctx context.Context) (dump stellar1.BundleRestricted, err error) {
	if s.G().Env.GetRunMode() != libkb.DevelRunMode {
		return dump, errors.New("WalletDump only supported in devel run mode")
	}

	ctx, err, fin := s.Preamble(ctx, preambleArg{
		RPCName: "WalletDumpLocal",
		Err:     &err,
	})
	defer fin()
	if err != nil {
		return dump, err
	}

	mctx := libkb.NewMetaContext(ctx, s.G())

	// verify passphrase
	username := s.G().GetEnv().GetUsername().String()

	arg := libkb.DefaultPassphrasePromptArg(mctx, username)
	secretUI := s.uiSource.SecretUI(s.G(), 0)
	res, err := secretUI.GetPassphrase(arg, nil)
	if err != nil {
		return dump, err
	}
	_, err = libkb.VerifyPassphraseForLoggedInUser(mctx, res.Passphrase)
	if err != nil {
		return dump, err
	}

	bundle, _, _, err := remote.FetchSecretlessBundle(ctx, s.G())
	if err != nil {
		return dump, err
	}
	newAccBundles := make(map[stellar1.AccountID]stellar1.AccountBundle)
	for _, acct := range bundle.Accounts {
		singleBundle, _, _, err := remote.FetchAccountBundle(ctx, s.G(), acct.AccountID)
		if err != nil {
			// if we can't fetch the secret for this account, just continue on
			continue
		}
		accBundle := singleBundle.AccountBundles[acct.AccountID]
		newAccBundles[acct.AccountID] = accBundle
	}
	bundle.AccountBundles = newAccBundles

	return *bundle, err
}
